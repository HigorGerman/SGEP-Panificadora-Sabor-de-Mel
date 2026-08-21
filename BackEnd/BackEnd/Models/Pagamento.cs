namespace BackEnd.Models;

public class Pagamento 
{
    public int Id { get; set; }
    public int EncomendaId { get; set; }
    public int? CaixaId { get; set; }
    public decimal ValorTotal { get; set; }
    public decimal ValorSinal { get; set; }
    public decimal SaldoDevedor { get; set; }
    public string? FormaPgtoSinal { get; set; }
    public string Status { get; set; } = "pendente";
    public string FormaPagamento { get; set; } = "Não informada";
    public string? PreferenceId { get; set; }
    public long? MpPaymentId { get; set; }
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
}