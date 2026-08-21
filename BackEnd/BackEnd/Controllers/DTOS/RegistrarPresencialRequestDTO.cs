namespace BackEnd.Controllers.DTOS
{
    public class RegistrarPresencialRequestDTO
    {
        public int EncomendaId { get; set; }
        public string? FormaPagamento { get; set; } = "A combinar / Balcão";
    }
}
