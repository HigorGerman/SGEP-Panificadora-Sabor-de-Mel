namespace BackEnd.Models;

public class Produto {
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public decimal PrecoUnitario { get; set; }
    public int CategoriaId { get; set; }
    public Categoria? Categoria { get; set; }
    public string? ImagemUrl { get; set; }
    public string? Descricao { get; set; }
    public Receita? Receita { get; set; }
}