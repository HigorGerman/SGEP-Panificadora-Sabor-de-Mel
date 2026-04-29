namespace BackEnd.Models;

public class Caixa {
    public int Id { get; set; }
    public DateTime DataAbertura { get; set; }
    public decimal ValorInicial { get; set; }
    public string Status { get; set; } = "Aberto";
}