namespace BackEnd.Controllers.DTOS
{
    public class ConfirmarRetornoMercadoPagoDTO
    {
        private int _encomendaId;

        public int EncomendaId
        {
            get
            {
                if (_encomendaId > 0) return _encomendaId;
                if (!string.IsNullOrWhiteSpace(ExternalReference) && int.TryParse(ExternalReference, out int parsed))
                {
                    return parsed;
                }
                return 0;
            }
            set => _encomendaId = value;
        }

        public string? ExternalReference { get; set; }
        public long? PaymentId { get; set; }
        public string? Status { get; set; }
        public string? PreferenceId { get; set; }
        public string? PaymentType { get; set; }
    }
}
