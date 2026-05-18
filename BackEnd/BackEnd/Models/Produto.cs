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
    public bool PermiteCustomizacao { get; set; }
    public string? TemplateCustomizacao { get; set; }
    public bool ContemGluten { get; set; } = true;
    public bool ContemLactose { get; set; } = true;
    public bool ContemAcucar { get; set; } = true;
}