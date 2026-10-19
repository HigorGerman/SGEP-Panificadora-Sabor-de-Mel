namespace BackEnd.Controllers.DTOS;

public class ClienteInadimplenciaItemDTO
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Cpf { get; set; }
    public string? Telefone { get; set; }
    public string? Email { get; set; }
    public int QtdEncomendasAtraso { get; set; }
    public int QtdEncomendasPendentes { get; set; }
    public decimal ValorTotalDevido { get; set; }
    public bool BloqueadoEncomendas { get; set; }
    public string? MotivoBloqueio { get; set; }
    public bool RiscoAutomatico => QtdEncomendasPendentes >= 2 || QtdEncomendasAtraso >= 2;
}

public class AlterarBloqueioRequestDTO
{
    public bool BloqueadoEncomendas { get; set; }
    public string? MotivoBloqueio { get; set; }
}

public class VerificarCpfResponseDTO
{
    public int? ClienteId { get; set; }
    public string? Nome { get; set; }
    public string Cpf { get; set; } = string.Empty;
    public bool BloqueadoEncomendas { get; set; }
    public string? MotivoBloqueio { get; set; }
    public int QtdEncomendasPendentes { get; set; }
    public int QtdEncomendasAtraso { get; set; }
    public decimal ValorTotalDevido { get; set; }
    public bool PodeRealizarEncomenda { get; set; }
    public bool AlertaPendenciaAnterior { get; set; }
    public string Mensagem { get; set; } = string.Empty;
}
