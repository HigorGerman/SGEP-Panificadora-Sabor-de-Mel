using BackEnd.Models;

namespace BackEnd.Repository
{
    public interface IPagamentoRepository
    {
        int Criar(Pagamento pagamento);
        Pagamento? ObterPorId(int id);
        Pagamento? ObterPorEncomendaId(int encomendaId);
        Pagamento? ObterPorPreferenceId(string preferenceId);
        Pagamento? ObterPorMpPaymentId(long mpPaymentId);
        bool Atualizar(Pagamento pagamento);
        bool AtualizarStatus(int id, string status, string? formaPagamento = null, decimal? saldoDevedor = null);
        bool AtualizarMercadoPagoInfo(int id, string? preferenceId, long? mpPaymentId);
        bool LiquidarSaldo(int encomendaId, string formaPagamento, int? caixaId);
    }
}
