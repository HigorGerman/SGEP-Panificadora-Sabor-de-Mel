namespace BackEnd.Controllers.DTOS
{
    public class PixPaymentResponseDTO
    {
        public string? CopyAndPaste { get; set; }
        public string? QrCodeBase64 { get; set; }
        public long PaymentId { get; set; }
    }
}
