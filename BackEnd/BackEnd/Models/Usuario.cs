namespace BackEnd.Models;


public class Usuario
{
    // O nome do Enum que você escolheu
    public enum PerfilEnum { Admin = 0, Funcionario = 1 }

    public int Id { get; set; }
    public string UsuarioNome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    
    // A propriedade usando o tipo acima
    public PerfilEnum Perfil { get; set; } 
    public bool Excluido { get; set; }
}