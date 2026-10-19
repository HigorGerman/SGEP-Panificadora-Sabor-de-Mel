using System;

namespace BackEnd.Models
{
    public class TokenAutenticacao
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public string CodigoToken { get; set; } = string.Empty;
        public string TipoToken { get; set; } = string.Empty; // "RECUPERACAO_SENHA", "EXCLUSAO_CONTA"
        public DateTime DataExpiracao { get; set; }
        public bool Utilizado { get; set; } = false;
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    }
}
