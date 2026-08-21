namespace BackEnd.Controllers.DTOS
{
    public class GerarPreferenciaResponseDTO
    {
        public string PreferenceId { get; set; } = string.Empty;
        public string InitPoint { get; set; } = string.Empty;
        public string SandboxInitPoint { get; set; } = string.Empty;
        public int PagamentoId { get; set; }
        public decimal ValorCobrado { get; set; }
        public decimal SaldoDevedor { get; set; }
    }
}
