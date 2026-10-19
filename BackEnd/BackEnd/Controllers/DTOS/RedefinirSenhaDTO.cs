namespace BackEnd.Controllers.DTOS
{
    public class RedefinirSenhaDTO
    {
        public string Email { get; set; } = string.Empty;
        public string CodigoToken { get; set; } = string.Empty;
        public string NovaSenha { get; set; } = string.Empty;
    }
}
