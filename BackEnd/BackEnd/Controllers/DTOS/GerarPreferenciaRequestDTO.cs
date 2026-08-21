using System.ComponentModel.DataAnnotations;

namespace BackEnd.Controllers.DTOS
{
    public class GerarPreferenciaRequestDTO
    {
        [Required(ErrorMessage = "O ID da encomenda é obrigatório")]
        public int EncomendaId { get; set; }

        public bool CobrarApenasSinal { get; set; } = false;

        [EmailAddress(ErrorMessage = "E-mail inválido")]
        public string Email { get; set; } = "cliente@sabordemel.com";

        public string Nome { get; set; } = "Cliente Sabor de Mel";

        public string Cpf { get; set; } = "00000000000";
    }
}
