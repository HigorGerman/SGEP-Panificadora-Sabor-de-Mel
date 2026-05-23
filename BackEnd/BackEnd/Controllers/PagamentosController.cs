using BackEnd.Controllers.DTOS;
using Microsoft.AspNetCore.Mvc;
using MercadoPago.Client.Payment;
using MercadoPago.Client.Common;
using MercadoPago.Resource.Payment;
using MercadoPago.Error;
using System.Threading.Tasks;
using System.Diagnostics;
using System;
using System.Linq;

namespace BackEnd.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PagamentosController : ControllerBase
    {
        [HttpPost("teste-pix")]
        public async Task<IActionResult> TestePix([FromBody] PixPaymentRequestDTO request)
        {
            try
            {
                // Instanciar o cliente de pagamento do Mercado Pago
                var client = new PaymentClient();

                // Montar a requisição com o Payer completo exigido pela API do Mercado Pago
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

                // Opcional: Adicionar cabeçalho de idempotência recomendado para evitar duplicidade
                var requestOptions = new MercadoPago.Client.RequestOptions();
                requestOptions.CustomHeaders.Add("X-Idempotency-Key", Guid.NewGuid().ToString());

                // Enviar a requisição ao Mercado Pago garantindo cultura invariante
                // para evitar problemas de conversão de ponto/vírgula na serialização de decimais do SDK.
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

                // Extrair as informações do QR Code do PointOfInteraction.TransactionData
                var qrCode = payment.PointOfInteraction?.TransactionData?.QrCode;
                var qrCodeBase64 = payment.PointOfInteraction?.TransactionData?.QrCodeBase64;
                var paymentId = payment.Id ?? 0;

                // Montar o DTO de retorno
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
                // Erro específico da API do Mercado Pago
                Console.WriteLine("Erro da API do Mercado Pago:");
                Console.WriteLine($"Status Code: {apiEx.StatusCode}");
                Console.WriteLine($"Erro: {apiEx.Message}");
                if (apiEx.ApiError != null)
                {
                    Console.WriteLine($"Erro Detalhado: {apiEx.ApiError.Message}");
                    if (apiEx.ApiError.Cause != null)
                    {
                        var causes = string.Join(", ", apiEx.ApiError.Cause.Select(c => $"[{c.Code}] {c.Description}"));
                        Console.WriteLine($"Erros da API (Causas): {causes}");
                    }
                }
                return StatusCode(500, new { erro = "Erro na API do Mercado Pago ao processar o Pix", detalhe = apiEx.Message });
            }
            catch (Exception ex)
            {
                // Outro erro genérico
                Console.WriteLine($"Erro genérico ao processar pagamento Pix: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, new { erro = "Erro inesperado ao gerar pagamento Pix", detalhe = ex.Message });
            }
        }
    }
}
