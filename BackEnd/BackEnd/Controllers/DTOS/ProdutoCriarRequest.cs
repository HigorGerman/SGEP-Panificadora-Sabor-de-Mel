namespace BackEnd.Controllers.DTOS;

public class ProdutoCriarRequest
{
    public string Nome { get; set; } = string.Empty;
    public decimal PrecoUnitario { get; set; }
    public int CategoriaId { get; set; }
}