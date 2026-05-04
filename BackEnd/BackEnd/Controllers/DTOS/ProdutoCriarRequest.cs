namespace BackEnd.Controllers.DTOS;

public class ProdutoCriarRequest
{
    public string Nome { get; set; } = string.Empty;
    public decimal PrecoUnitario { get; set; }
    public int CategoriaId { get; set; }
    public string? Descricao { get; set; }
    public string? Ingredientes { get; set; }
    public string? ModoPreparo { get; set; }
    public string? Rendimento { get; set; }
}