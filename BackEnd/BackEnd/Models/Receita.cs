namespace BackEnd.Models;

public class Receita {
    public int Id { get; set; }
    public int ProdutoId { get; set; }
    public string? Ingredientes { get; set; }
    public string? ModoPreparo { get; set; }
    public string? Rendimento { get; set; }
}