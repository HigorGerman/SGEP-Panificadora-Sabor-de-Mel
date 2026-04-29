namespace BackEnd.Controllers.DTOS;

public class ClienteResponse
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Email { get; set; }
    public bool RestricaoGluten { get; set; }
    public bool RestricaoLactose { get; set; }
    public bool RestricaoAcucar { get; set; }
}