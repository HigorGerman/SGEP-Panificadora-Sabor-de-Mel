using System;
using System.Linq;
using System.Threading.Tasks;
using BackEnd.Controllers.DTOS;
using BackEnd.Services;
using MercadoPago.Client.Common;
using MercadoPago.Client.Payment;
using MercadoPago.Error;
using MercadoPago.Resource.Payment;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PagamentosController : ControllerBase
    {
        private readonly IPagamentoService _pagamentoService;

        public PagamentosController(IPagamentoService pagamentoService)
        {
            _pagamentoService = pagamentoService;
        }

        /// <summary>
        /// Endpoint para gerar preferência de pagamento no Mercado Pago (Checkout Pro - Pix/Cartão Crédito/Débito)
        /// </summary>
        [HttpPost("gerar-preferencia")]
        public async Task<IActionResult> GerarPreferencia([FromBody] GerarPreferenciaRequestDTO request)
        {
            try
            {
                var response = await _pagamentoService.GerarPreferenciaAsync(request);
                return Ok(response);
            }
            catch (ArgumentException argEx)
            {
                return NotFound(new { erro = argEx.Message });
            }
            catch (MercadoPagoApiException apiEx)
            {
                Console.WriteLine($"Erro API Mercado Pago: {apiEx.StatusCode} - {apiEx.Message}");
                return StatusCode(500, new { erro = "Erro na API do Mercado Pago ao gerar preferência", detalhe = apiEx.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao gerar preferência de pagamento: {ex.Message}");
                return StatusCode(500, new { erro = "Erro ao gerar preferência de pagamento", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Endpoint Webhook para capturar notificações automáticas de status de pagamento do Mercado Pago
        /// </summary>
        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook(
            [FromQuery] string? type,
            [FromQuery] string? topic,
            [FromQuery(Name = "data.id")] string? dataId,
            [FromQuery] string? id,
            [FromBody] MercadoPagoWebhookNotification? notification)
        {
            try
            {
                string targetType = type ?? topic ?? notification?.Type ?? notification?.Action ?? "payment";
                string targetDataId = dataId ?? notification?.Data?.Id ?? notification?.Id?.ToString() ?? id ?? string.Empty;

                if (!string.IsNullOrWhiteSpace(targetDataId))
                {
                    await _pagamentoService.ProcessarWebhookMercadoPagoAsync(targetType, targetDataId);
                }

                // O Mercado Pago exige resposta HTTP 200/201 OK para confirmar recebimento do webhook
                return Ok(new { status = "recebido" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao processar Webhook do Mercado Pago: {ex.Message}");
                return Ok(new { status = "erro_processamento", mensagem = ex.Message });
            }
        }

        /// <summary>
        /// Endpoint para confirmar o retorno do cliente após pagamento no Mercado Pago Checkout Pro
        /// </summary>
        [HttpPost("confirmar-retorno")]
        public async Task<IActionResult> ConfirmarRetorno([FromBody] ConfirmarRetornoMercadoPagoDTO dto)
        {
            try
            {
                if (dto.EncomendaId <= 0)
                {
                    return BadRequest(new { erro = "ID da encomenda inválido." });
                }

                var sucesso = await _pagamentoService.ConfirmarRetornoMercadoPagoAsync(dto);
                if (sucesso)
                {
                    return Ok(new { mensagem = "Pagamento via Mercado Pago confirmado com sucesso e encomenda atualizada!" });
                }
                return BadRequest(new { erro = "Não foi possível confirmar o pagamento do Mercado Pago." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao confirmar retorno do Mercado Pago", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Consulta a situação financeira/pagamento de uma encomenda específica
        /// </summary>
        [HttpGet("encomenda/{encomendaId:int}")]
        public IActionResult ObterPorEncomendaId(int encomendaId)
        {
            try
            {
                var pagamento = _pagamentoService.ObterPorEncomendaId(encomendaId);
                if (pagamento == null)
                {
                    return NotFound(new { mensagem = "Nenhum registro de pagamento encontrado para esta encomenda." });
                }
                return Ok(pagamento);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao obter status do pagamento", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Endpoint para obter estatísticas agregadas e métricas financeiras para o Dashboard
        /// </summary>
        [HttpGet("dashboard")]
        public IActionResult ObterDashboard([FromQuery] DateTime? dataInicio, [FromQuery] DateTime? dataFim)
        {
            try
            {
                var dados = _pagamentoService.ObterDadosDashboard(dataInicio, dataFim);
                return Ok(dados);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao carregar dados do dashboard", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Endpoint para listar todas as encomendas com pagamentos pendentes na retirada (Balcão)
        /// </summary>
        [HttpGet("pendentes")]
        public IActionResult ObterPendentes()
        {
            try
            {
                var pendentes = _pagamentoService.ObterPendentesRetirada();
                return Ok(pendentes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao buscar pendências de pagamento", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Endpoint para dar baixa e liquidar o pagamento de uma encomenda no caixa da panificadora
        /// </summary>
        [HttpPost("liquidar")]
        public IActionResult Liquidar([FromBody] LiquidarPagamentoRequestDTO request)
        {
            try
            {
                if (request.EncomendaId <= 0)
                {
                    return BadRequest(new { erro = "ID da encomenda inválido." });
                }

                var sucesso = _pagamentoService.LiquidarSaldo(request.EncomendaId, request.FormaPagamento ?? "Dinheiro", request.CaixaId);
                if (sucesso)
                {
                    return Ok(new { mensagem = "Pagamento liquidado com sucesso e encomenda concluída." });
                }
                return BadRequest(new { erro = "Não foi possível liquidar o pagamento da encomenda." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao liquidar pagamento", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Endpoint para registrar o compromisso de pagamento presencial na retirada (Balcão da panificadora)
        /// </summary>
        [HttpPost("registrar-presencial")]
        public IActionResult RegistrarPresencial([FromBody] RegistrarPresencialRequestDTO request)
        {
            try
            {
                var sucesso = _pagamentoService.RegistrarPagamentoPresencial(request.EncomendaId, request.FormaPagamento ?? "A combinar / Balcão");
                if (sucesso)
                {
                    return Ok(new { mensagem = "Registro de pagamento presencial gravado com sucesso." });
                }
                return BadRequest(new { erro = "Não foi possível registrar o pagamento presencial." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao registrar pagamento presencial", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Endpoint legado/teste para gerar cobrança Pix isolada
        /// </summary>
        [HttpPost("teste-pix")]
        public async Task<IActionResult> TestePix([FromBody] PixPaymentRequestDTO request)
        {
            try
            {
                var client = new PaymentClient();

                var paymentRequest = new PaymentCreateRequest
                {
                    TransactionAmount = request.Valor,
                    PaymentMethodId = "pix",
                    Description = "Teste de Encomenda SGEP",
                    Payer = new PaymentPayerRequest
                    {
                        Email = "test_user_123@testuser.com",
                        FirstName = "Higor",
                        LastName = "Teste",
                        Identification = new IdentificationRequest
                        {
                            Type = "CPF",
                            Number = "50570534852"
                        }
                    }
                };

                var requestOptions = new MercadoPago.Client.RequestOptions();
                requestOptions.CustomHeaders.Add("X-Idempotency-Key", Guid.NewGuid().ToString());

                var originalCulture = System.Globalization.CultureInfo.CurrentCulture;
                var originalUiCulture = System.Globalization.CultureInfo.CurrentUICulture;
                Payment payment;
                try
                {
                    System.Globalization.CultureInfo.CurrentCulture = System.Globalization.CultureInfo.InvariantCulture;
                    System.Globalization.CultureInfo.CurrentUICulture = System.Globalization.CultureInfo.InvariantCulture;

                    payment = await client.CreateAsync(paymentRequest, requestOptions);
                }
                finally
                {
                    System.Globalization.CultureInfo.CurrentCulture = originalCulture;
                    System.Globalization.CultureInfo.CurrentUICulture = originalUiCulture;
                }

                if (payment == null)
                {
                    return BadRequest("Não foi possível gerar o pagamento no Mercado Pago.");
                }

                var qrCode = payment.PointOfInteraction?.TransactionData?.QrCode;
                var qrCodeBase64 = payment.PointOfInteraction?.TransactionData?.QrCodeBase64;
                var paymentId = payment.Id ?? 0;

                var response = new PixPaymentResponseDTO
                {
                    CopyAndPaste = qrCode,
                    QrCodeBase64 = qrCodeBase64,
                    PaymentId = paymentId
                };

                return Ok(response);
            }
            catch (MercadoPagoApiException apiEx)
            {
                return StatusCode(500, new { erro = "Erro na API do Mercado Pago ao processar o Pix", detalhe = apiEx.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro inesperado ao gerar pagamento Pix", detalhe = ex.Message });
            }
        }
    }
}
