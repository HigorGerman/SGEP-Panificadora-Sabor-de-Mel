namespace BackEnd.Controllers.DTOS;

public class ProdutoResponse
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public decimal PrecoUnitario { get; set; }
    public int CategoriaId { get; set; }
    public string? NomeCategoria { get; set; } 
    public string? ImagemUrl { get; set; }
}