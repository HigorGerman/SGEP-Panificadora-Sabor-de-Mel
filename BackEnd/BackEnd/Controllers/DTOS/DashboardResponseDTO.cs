using System;
using System.Collections.Generic;

namespace BackEnd.Controllers.DTOS
{
    public class DashboardResponseDTO
    {
        public decimal FaturamentoTotal { get; set; }
        public int TotalEncomendas { get; set; }
        public decimal TicketMedio { get; set; }
        public decimal PendenteAReceber { get; set; }

        public decimal FaturamentoDinheiro { get; set; }
        public decimal FaturamentoCartao { get; set; }
        public decimal FaturamentoPix { get; set; }
        public decimal FaturamentoMercadoPago { get; set; }

        public List<ProdutoMaisVendidoDTO> ProdutosMaisVendidos { get; set; } = new List<ProdutoMaisVendidoDTO>();
        public List<PagamentoFormaDTO> PagamentosPorForma { get; set; } = new List<PagamentoFormaDTO>();
        public List<EvolucaoDiaDTO> EvolucaoFaturamento { get; set; } = new List<EvolucaoDiaDTO>();
    }

    public class ProdutoMaisVendidoDTO
    {
        public int ProdutoId { get; set; }
        public string ProdutoNome { get; set; } = string.Empty;
        public int QuantidadeVendida { get; set; }
        public decimal ValorArrecadado { get; set; }
    }

    public class PagamentoFormaDTO
    {
        public string FormaPagamento { get; set; } = string.Empty;
        public int Quantidade { get; set; }
        public decimal ValorTotal { get; set; }
    }

    public class EvolucaoDiaDTO
    {
        public string Data { get; set; } = string.Empty;
        public decimal ValorTotal { get; set; }
        public int TotalEncomendas { get; set; }
    }
}
