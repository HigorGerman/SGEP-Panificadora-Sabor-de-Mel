namespace BackEnd.Models;

public class Encomenda {
    public enum StatusEnum
    {
        Pendente = 0,
        EmAndamento = 1,
        Concluida = 2,
        Cancelada = 3
    }

    public int Id { get; set; }
    public int? ClienteId { get; set; }
    public int? UsuarioId { get; set; }
    public DateTime DataEntrega { get; set; }
    public StatusEnum Status { get; set; }
    public decimal ValorTotal { get; set; }
    public string? Observacao { get; set; }
    public List<ItemEncomenda> Itens { get; set; } = new List<ItemEncomenda>();
}