using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading.Tasks;
using BackEnd.Controllers.DTOS;
using BackEnd.Models;
using BackEnd.Repository;
using MercadoPago.Client.Common;
using MercadoPago.Client.Payment;
using MercadoPago.Client.Preference;
using MercadoPago.Resource.Payment;
using MercadoPago.Resource.Preference;

namespace BackEnd.Services
{
    public class PagamentoService : IPagamentoService
    {
        private readonly IPagamentoRepository _pagamentoRepository;
        private readonly EncomendaRepository _encomendaRepository;

        public PagamentoService(IPagamentoRepository pagamentoRepository, EncomendaRepository encomendaRepository)
        {
            _pagamentoRepository = pagamentoRepository;
            _encomendaRepository = encomendaRepository;
        }

        public decimal CalcularSinal(decimal valorTotal)
        {
            return Math.Round(valorTotal * 0.50m, 2);
        }

        public async Task<GerarPreferenciaResponseDTO> GerarPreferenciaAsync(GerarPreferenciaRequestDTO request)
        {
            var encomenda = _encomendaRepository.ObterPorId(request.EncomendaId);
            if (encomenda == null)
            {
                throw new ArgumentException($"Encomenda com ID {request.EncomendaId} não foi encontrada.");
            }

            decimal valorTotal = encomenda.ValorTotal;
            decimal valorCobrar = valorTotal;
            decimal valorSinal = 0m;
            decimal saldoDevedor = 0m;

            // Criar Preferência no Mercado Pago (Checkout Pro)
            var client = new PreferenceClient();
            var preferenceRequest = new PreferenceRequest
            {
                Items = new List<PreferenceItemRequest>
                {
                    new PreferenceItemRequest
                    {
                        Title = $"Encomenda #{encomenda.Id} - Panificadora Sabor de Mel",
                        Quantity = 1,
                        CurrencyId = "BRL",
                        UnitPrice = valorCobrar
                    }
                },
                Payer = new PreferencePayerRequest
                {
                    Email = string.IsNullOrWhiteSpace(request.Email) ? "cliente@sabordemel.com" : request.Email,
                    Name = string.IsNullOrWhiteSpace(request.Nome) ? "Cliente Sabor de Mel" : request.Nome,
                    Identification = new IdentificationRequest
                    {
                        Type = "CPF",
                        Number = string.IsNullOrWhiteSpace(request.Cpf) ? "00000000000" : request.Cpf.Replace(".", "").Replace("-", "")
                    }
                },
                ExternalReference = encomenda.Id.ToString(),
                BackUrls = new PreferenceBackUrlsRequest
                {
                    Success = "http://localhost:3000/historico?status=sucesso",
                    Failure = "http://localhost:3000/historico?status=falha",
                    Pending = "http://localhost:3000/historico?status=pendente"
                }
            };

            var originalCulture = CultureInfo.CurrentCulture;
            var originalUiCulture = CultureInfo.CurrentUICulture;
            Preference preference;
            try
            {
                CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;
                CultureInfo.CurrentUICulture = CultureInfo.InvariantCulture;

                preference = await client.CreateAsync(preferenceRequest);
            }
            finally
            {
                CultureInfo.CurrentCulture = originalCulture;
                CultureInfo.CurrentUICulture = originalUiCulture;
            }

            if (preference == null || string.IsNullOrEmpty(preference.Id))
            {
                throw new Exception("Falha ao gerar preferência de pagamento no Mercado Pago.");
            }

            // Persistir ou atualizar registro no banco de dados local
            var pagamentoExistente = _pagamentoRepository.ObterPorEncomendaId(encomenda.Id);
            int pagamentoId;

            if (pagamentoExistente != null)
            {
                pagamentoExistente.ValorTotal = valorTotal;
                pagamentoExistente.ValorSinal = valorSinal;
                pagamentoExistente.SaldoDevedor = saldoDevedor;
                pagamentoExistente.PreferenceId = preference.Id;
                pagamentoExistente.Status = "pendente";

                _pagamentoRepository.Atualizar(pagamentoExistente);
                pagamentoId = pagamentoExistente.Id;
            }
            else
            {
                var novoPagamento = new Pagamento
                {
                    EncomendaId = encomenda.Id,
                    ValorTotal = valorTotal,
                    ValorSinal = valorSinal,
                    SaldoDevedor = saldoDevedor,
                    FormaPgtoSinal = request.CobrarApenasSinal ? "Mercado Pago Checkout Pro" : null,
                    FormaPagamento = "Mercado Pago",
                    Status = "pendente",
                    PreferenceId = preference.Id,
                    DataCriacao = DateTime.UtcNow
                };

                pagamentoId = _pagamentoRepository.Criar(novoPagamento);
            }

            return new GerarPreferenciaResponseDTO
            {
                PreferenceId = preference.Id,
                InitPoint = preference.InitPoint ?? string.Empty,
                SandboxInitPoint = preference.SandboxInitPoint ?? string.Empty,
                PagamentoId = pagamentoId,
                ValorCobrado = valorCobrar,
                SaldoDevedor = saldoDevedor
            };
        }

        public async Task<bool> ProcessarWebhookMercadoPagoAsync(string type, string dataId)
        {
            if (string.IsNullOrWhiteSpace(dataId)) return false;

            if (type == "payment" || type == "payment.created" || type == "payment.updated")
            {
                if (long.TryParse(dataId, out long paymentId))
                {
                    return await ProcessarConfirmacaoMercadoPagoAsync(paymentId);
                }
            }
            return false;
        }

        public async Task<bool> ProcessarConfirmacaoMercadoPagoAsync(long mpPaymentId)
        {
            try
            {
                var paymentClient = new PaymentClient();
                Payment payment = await paymentClient.GetAsync(mpPaymentId);

                if (payment == null) return false;

                if (!int.TryParse(payment.ExternalReference, out int encomendaId))
                {
                    // Se não tiver ExternalReference, tenta buscar por mp_payment_id no banco
                    var pagBanco = _pagamentoRepository.ObterPorMpPaymentId(mpPaymentId);
                    if (pagBanco == null) return false;
                    encomendaId = pagBanco.EncomendaId;
                }

                var pagamento = _pagamentoRepository.ObterPorEncomendaId(encomendaId);
                if (pagamento == null) return false;

                if (payment.Status == "approved")
                {
                    string novoStatus = pagamento.SaldoDevedor > 0 ? "sinal_pago" : "pago";
                    string formaPgto = payment.PaymentMethodId ?? "Mercado Pago";

                    _pagamentoRepository.AtualizarMercadoPagoInfo(pagamento.Id, null, payment.Id);
                    _pagamentoRepository.AtualizarStatus(pagamento.Id, novoStatus, formaPgto);

                    // Se a encomenda estiver pendente, move para EmAndamento
                    var encomenda = _encomendaRepository.ObterPorId(encomendaId);
                    if (encomenda != null && encomenda.Status == Encomenda.StatusEnum.Pendente)
                    {
                        _encomendaRepository.AtualizarStatus(encomendaId, Encomenda.StatusEnum.EmAndamento);
                    }

                    return true;
                }
                else if (payment.Status == "cancelled" || payment.Status == "rejected")
                {
                    _pagamentoRepository.AtualizarStatus(pagamento.Id, "cancelado");
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao processar confirmação de pagamento do Mercado Pago: {ex.Message}");
                return false;
            }
        }

        public Pagamento? ObterPorEncomendaId(int encomendaId)
        {
            return _pagamentoRepository.ObterPorEncomendaId(encomendaId);
        }

        public bool LiquidarSaldo(int encomendaId, string formaPagamento, int? caixaId = null)
        {
            var sucesso = _pagamentoRepository.LiquidarSaldo(encomendaId, formaPagamento, caixaId);
            if (sucesso)
            {
                var encomenda = _encomendaRepository.ObterPorId(encomendaId);
                if (encomenda != null && encomenda.Status < Encomenda.StatusEnum.Concluida)
                {
                    _encomendaRepository.AtualizarStatus(encomendaId, Encomenda.StatusEnum.Concluida);
                }
            }
            return sucesso;
        }

        public List<PagamentoPendenteDTO> ObterPendentesRetirada()
        {
            return _pagamentoRepository.ObterPendentesRetirada();
        }

        public bool RegistrarPagamentoPresencial(int encomendaId, string formaPagamento = "A combinar / Balcão")
        {
            var encomenda = _encomendaRepository.ObterPorId(encomendaId);
            if (encomenda == null) return false;

            var pagamentoExistente = _pagamentoRepository.ObterPorEncomendaId(encomendaId);
            if (pagamentoExistente != null)
            {
                pagamentoExistente.ValorTotal = encomenda.ValorTotal;
                pagamentoExistente.ValorSinal = 0m;
                pagamentoExistente.SaldoDevedor = encomenda.ValorTotal;
                pagamentoExistente.FormaPagamento = string.IsNullOrWhiteSpace(formaPagamento) ? "A combinar / Balcão" : formaPagamento;
                pagamentoExistente.Status = "pendente";
                return _pagamentoRepository.Atualizar(pagamentoExistente);
            }
            else
            {
                var novo = new Pagamento
                {
                    EncomendaId = encomendaId,
                    ValorTotal = encomenda.ValorTotal,
                    ValorSinal = 0m,
                    SaldoDevedor = encomenda.ValorTotal,
                    FormaPagamento = string.IsNullOrWhiteSpace(formaPagamento) ? "A combinar / Balcão" : formaPagamento,
                    Status = "pendente",
                    DataCriacao = DateTime.UtcNow
                };
                return _pagamentoRepository.Criar(novo) > 0;
            }
        }
    }
}
