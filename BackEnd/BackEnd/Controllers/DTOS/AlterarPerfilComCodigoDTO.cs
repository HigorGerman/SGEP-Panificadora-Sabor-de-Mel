namespace BackEnd.Controllers.DTOS
{
    public class AlterarPerfilComCodigoDTO
    {
        public string Nome { get; set; } = string.Empty;
        public string? Telefone { get; set; }
        public bool RestricaoGluten { get; set; }
        public bool RestricaoLactose { get; set; }
        public bool RestricaoAcucar { get; set; }
        public string? NovaSenha { get; set; }
        public string CodigoToken { get; set; } = string.Empty;
    }
}
