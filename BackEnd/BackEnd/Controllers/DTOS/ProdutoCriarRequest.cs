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
    public bool PermiteCustomizacao { get; set; }
    public string? TemplateCustomizacao { get; set; }
    public bool ContemGluten { get; set; } = true;
    public bool ContemLactose { get; set; } = true;
    public bool ContemAcucar { get; set; } = true;
}