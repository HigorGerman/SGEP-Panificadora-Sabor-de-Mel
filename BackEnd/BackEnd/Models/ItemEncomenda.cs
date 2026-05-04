namespace BackEnd.Models;

public class ItemEncomenda {
    public int Id { get; set; }
    public int EncomendaId { get; set; }
    public int ProdutoId { get; set; }
    public int Quantidade { get; set; }
    public decimal PrecoUnitario { get; set; }
    public string? ProdutoNome { get; set; }
    public string? EspecificacoesTecnicas { get; set; }
}