using System.ComponentModel.DataAnnotations;

namespace BackEnd.Controllers.DTOS
{
    public class PixPaymentRequestDTO
    {
        [Required(ErrorMessage = "O valor é obrigatório")]
        [Range(0.01, double.MaxValue, ErrorMessage = "O valor deve ser maior que zero")]
        public decimal Valor { get; set; }
    }
}
