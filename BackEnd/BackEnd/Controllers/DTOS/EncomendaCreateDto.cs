namespace BackEnd.Controllers.DTOS;


public record EncomendaCreateDto(
    int? ClienteId,
    int? UsuarioId,
    DateTime DataEntrega,
    string? Observacao,
    List<ItemEncomendaDto> Itens,
    string? Cpf = null
);

public record ItemEncomendaDto(
    int ProdutoId,
    int Quantidade,
    string? EspecificacoesTecnicas
);