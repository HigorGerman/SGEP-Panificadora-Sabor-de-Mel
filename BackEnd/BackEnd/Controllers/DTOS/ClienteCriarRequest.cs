namespace BackEnd.Controllers.DTOS;

public class ClienteCriarRequest
{
    public string Nome { get; set; } = string.Empty;
    public string? Cpf { get; set; }
    public string? Email { get; set; }
    public string? Senha { get; set; }
    public string? Telefone { get; set; }
    public bool RestricaoGluten { get; set; }
    public bool RestricaoLactose { get; set; }
    public bool RestricaoAcucar { get; set; }
}