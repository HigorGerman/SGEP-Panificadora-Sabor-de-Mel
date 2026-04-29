namespace BackEnd.Controllers.DTOS;

public class UsuarioResponse
{
    public int Id { get; set; }
    public string UsuarioNome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int Perfil { get; set; }
}