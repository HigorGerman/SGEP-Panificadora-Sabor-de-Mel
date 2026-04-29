namespace BackEnd.Controllers.DTOS;

public class UsuarioCriarRequest
{
    public string UsuarioNome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    public int Perfil { get; set; } // 0: Admin, 1: Funcionario
}