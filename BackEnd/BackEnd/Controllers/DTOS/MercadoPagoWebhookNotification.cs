using System.Text.Json.Serialization;

namespace BackEnd.Controllers.DTOS
{
    public class MercadoPagoWebhookNotification
    {
        [JsonPropertyName("action")]
        public string? Action { get; set; }

        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("data")]
        public MercadoPagoWebhookData? Data { get; set; }

        [JsonPropertyName("id")]
        public object? Id { get; set; }
    }

    public class MercadoPagoWebhookData
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }
    }
}
