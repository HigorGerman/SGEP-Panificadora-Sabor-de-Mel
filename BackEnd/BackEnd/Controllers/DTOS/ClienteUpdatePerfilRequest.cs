namespace BackEnd.Controllers.DTOS;

public class ClienteUpdatePerfilRequest
{
    public string Nome { get; set; } = string.Empty;
    public string? Telefone { get; set; }
    public bool RestricaoGluten { get; set; }
    public bool RestricaoLactose { get; set; }
    public bool RestricaoAcucar { get; set; }
}
