namespace BackEnd.Controllers.DTOS;


public record EncomendaCreateDto(
    int? ClienteId,
    int? UsuarioId,
    DateTime DataEntrega,
    string? Observacao,
    List<ItemEncomendaDto> Itens
);

public record ItemEncomendaDto(
    int ProdutoId,
    int Quantidade
);