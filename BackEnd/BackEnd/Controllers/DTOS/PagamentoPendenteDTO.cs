using System;
using System.Collections.Generic;

namespace BackEnd.Controllers.DTOS
{
    public class PagamentoPendenteDTO
    {
        public int EncomendaId { get; set; }
        public int? ClienteId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public string ClienteCpf { get; set; } = string.Empty;
        public string ClienteTelefone { get; set; } = string.Empty;
        public DateTime DataRetirada { get; set; }
        public decimal ValorTotal { get; set; }
        public decimal SaldoDevedor { get; set; }
        public string StatusPagamento { get; set; } = "pendente";
        public string FormaPagamento { get; set; } = "Não informada";
        public string? Observacao { get; set; }
        public List<ItemPendenteDTO> Itens { get; set; } = new List<ItemPendenteDTO>();
    }

    public class ItemPendenteDTO
    {
        public int ProdutoId { get; set; }
        public string ProdutoNome { get; set; } = string.Empty;
        public int Quantidade { get; set; }
        public decimal PrecoUnitario { get; set; }
        public string? EspecificacoesTecnicas { get; set; }
    }
}
