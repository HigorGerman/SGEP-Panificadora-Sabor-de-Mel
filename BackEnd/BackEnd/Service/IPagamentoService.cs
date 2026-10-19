using System.Threading.Tasks;
using BackEnd.Controllers.DTOS;
using BackEnd.Models;

namespace BackEnd.Services
{
    public interface IPagamentoService
    {
        decimal CalcularSinal(decimal valorTotal);
        Task<GerarPreferenciaResponseDTO> GerarPreferenciaAsync(GerarPreferenciaRequestDTO request);
        Task<bool> ProcessarWebhookMercadoPagoAsync(string type, string dataId);
        Task<bool> ConfirmarRetornoMercadoPagoAsync(ConfirmarRetornoMercadoPagoDTO dto);
        Pagamento? ObterPorEncomendaId(int encomendaId);
        bool LiquidarSaldo(int encomendaId, string formaPagamento, int? caixaId = null);
        bool RegistrarPagamentoPresencial(int encomendaId, string formaPagamento = "A combinar / Balcão");
        System.Collections.Generic.List<PagamentoPendenteDTO> ObterPendentesRetirada();
        DashboardResponseDTO ObterDadosDashboard(System.DateTime? dataInicio, System.DateTime? dataFim);
    }
}
