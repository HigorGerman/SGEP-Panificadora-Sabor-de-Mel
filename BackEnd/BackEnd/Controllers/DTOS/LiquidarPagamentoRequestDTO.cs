namespace BackEnd.Controllers.DTOS
{
    public class LiquidarPagamentoRequestDTO
    {
        public int EncomendaId { get; set; }
        public string FormaPagamento { get; set; } = "Dinheiro";
        public int? CaixaId { get; set; }
    }
}
