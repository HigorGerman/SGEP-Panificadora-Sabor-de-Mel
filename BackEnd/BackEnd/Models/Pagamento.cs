namespace BackEnd.Models;

public class Pagamento {
    public int Id { get; set; }
    public int EncomendaId { get; set; }
    public int CaixaId { get; set; }
    public decimal ValorSinal { get; set; }
    public decimal SaldoDevedor { get; set; }
    public string? FormaPgtoSinal { get; set; }
}