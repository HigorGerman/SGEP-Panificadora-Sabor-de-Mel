namespace BackEnd.Models;

public class Categoria {
    public int Id { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public bool Inativo { get; set; }
}