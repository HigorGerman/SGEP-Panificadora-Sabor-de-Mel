using System;
using BackEnd.Models;
using Npgsql;

namespace BackEnd.Repository
{
    public class PagamentoRepository : IPagamentoRepository
    {
        private readonly PostgresDbContext _context;

        public PagamentoRepository(PostgresDbContext context)
        {
            _context = context;
            GarantirTabelaExiste();
        }

        private void GarantirTabelaExiste()
        {
            var conexao = _context.GetConexao();
            using var cmd = conexao.CreateCommand();
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS pagamento (
                    id SERIAL PRIMARY KEY,
                    encomenda_id INTEGER NOT NULL REFERENCES encomenda(id) ON DELETE CASCADE,
                    caixa_id INTEGER REFERENCES caixa(id),
                    valor_total NUMERIC(10, 2) DEFAULT 0.00,
                    valor_sinal NUMERIC(10, 2) DEFAULT 0.00,
                    saldo_devedor NUMERIC(10, 2) DEFAULT 0.00,
                    forma_pagamento_sinal VARCHAR(100),
                    status VARCHAR(50) NOT NULL DEFAULT 'pendente',
                    forma_pagamento VARCHAR(100) DEFAULT 'Não informada',
                    preference_id VARCHAR(255),
                    mp_payment_id BIGINT,
                    data_criacao TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
                );

                ALTER TABLE pagamento ADD COLUMN IF NOT EXISTS valor_total NUMERIC(10, 2) DEFAULT 0.00;
                ALTER TABLE pagamento ADD COLUMN IF NOT EXISTS valor_sinal NUMERIC(10, 2) DEFAULT 0.00;
                ALTER TABLE pagamento ADD COLUMN IF NOT EXISTS saldo_devedor NUMERIC(10, 2) DEFAULT 0.00;
                ALTER TABLE pagamento ADD COLUMN IF NOT EXISTS forma_pagamento_sinal VARCHAR(100);
                ALTER TABLE pagamento ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pendente';
                ALTER TABLE pagamento ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(100) DEFAULT 'Não informada';
                ALTER TABLE pagamento ADD COLUMN IF NOT EXISTS preference_id VARCHAR(255);
                ALTER TABLE pagamento ADD COLUMN IF NOT EXISTS mp_payment_id BIGINT;
                ALTER TABLE pagamento ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC');
            ";
            cmd.ExecuteNonQuery();
        }

        public int Criar(Pagamento pagamento)
        {
            var conexao = _context.GetConexao();
            using var cmd = conexao.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO pagamento (
                    encomenda_id, caixa_id, valor_total, valor_sinal, saldo_devedor, 
                    forma_pagamento_sinal, status, forma_pagamento, preference_id, mp_payment_id, data_criacao
                ) VALUES (
                    @encomendaId, @caixaId, @valorTotal, @valorSinal, @saldoDevedor, 
                    @formaPgtoSinal, @status, @formaPagamento, @preferenceId, @mpPaymentId, @dataCriacao
                ) RETURNING id;";

            cmd.Parameters.AddWithValue("@encomendaId", pagamento.EncomendaId);
            cmd.Parameters.AddWithValue("@caixaId", (object?)pagamento.CaixaId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@valorTotal", pagamento.ValorTotal);
            cmd.Parameters.AddWithValue("@valorSinal", pagamento.ValorSinal);
            cmd.Parameters.AddWithValue("@saldoDevedor", pagamento.SaldoDevedor);
            cmd.Parameters.AddWithValue("@formaPgtoSinal", (object?)pagamento.FormaPgtoSinal ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@status", pagamento.Status);
            cmd.Parameters.AddWithValue("@formaPagamento", pagamento.FormaPagamento);
            cmd.Parameters.AddWithValue("@preferenceId", (object?)pagamento.PreferenceId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@mpPaymentId", (object?)pagamento.MpPaymentId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@dataCriacao", pagamento.DataCriacao);

            var idResult = cmd.ExecuteScalar();
            return idResult != null ? Convert.ToInt32(idResult) : 0;
        }

        public Pagamento? ObterPorId(int id)
        {
            var conexao = _context.GetConexao();
            using var cmd = conexao.CreateCommand();
            cmd.CommandText = "SELECT * FROM pagamento WHERE id = @id LIMIT 1";
            cmd.Parameters.AddWithValue("@id", id);

            using var dr = cmd.ExecuteReader();
            if (dr.Read())
            {
                return MapearPagamento(dr);
            }
            return null;
        }

        public Pagamento? ObterPorEncomendaId(int encomendaId)
        {
            var conexao = _context.GetConexao();
            using var cmd = conexao.CreateCommand();
            cmd.CommandText = "SELECT * FROM pagamento WHERE encomenda_id = @encomendaId ORDER BY id DESC LIMIT 1";
            cmd.Parameters.AddWithValue("@encomendaId", encomendaId);

            using var dr = cmd.ExecuteReader();
            if (dr.Read())
            {
                return MapearPagamento(dr);
            }
            return null;
        }

        public Pagamento? ObterPorPreferenceId(string preferenceId)
        {
            var conexao = _context.GetConexao();
            using var cmd = conexao.CreateCommand();
            cmd.CommandText = "SELECT * FROM pagamento WHERE preference_id = @preferenceId ORDER BY id DESC LIMIT 1";
            cmd.Parameters.AddWithValue("@preferenceId", preferenceId);

            using var dr = cmd.ExecuteReader();
            if (dr.Read())
            {
                return MapearPagamento(dr);
            }
            return null;
        }

        public Pagamento? ObterPorMpPaymentId(long mpPaymentId)
        {
            var conexao = _context.GetConexao();
            using var cmd = conexao.CreateCommand();
            cmd.CommandText = "SELECT * FROM pagamento WHERE mp_payment_id = @mpPaymentId ORDER BY id DESC LIMIT 1";
            cmd.Parameters.AddWithValue("@mpPaymentId", mpPaymentId);

            using var dr = cmd.ExecuteReader();
            if (dr.Read())
            {
                return MapearPagamento(dr);
            }
            return null;
        }

        public bool Atualizar(Pagamento pagamento)
        {
            var conexao = _context.GetConexao();
            using var cmd = conexao.CreateCommand();
            cmd.CommandText = @"
                UPDATE pagamento SET 
                    caixa_id = @caixaId,
                    valor_total = @valorTotal,
                    valor_sinal = @valorSinal,
                    saldo_devedor = @saldoDevedor,
                    forma_pagamento_sinal = @formaPgtoSinal,
                    status = @status,
                    forma_pagamento = @formaPagamento,
                    preference_id = @preferenceId,
                    mp_payment_id = @mpPaymentId
                WHERE id = @id";

            cmd.Parameters.AddWithValue("@id", pagamento.Id);
            cmd.Parameters.AddWithValue("@caixaId", (object?)pagamento.CaixaId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@valorTotal", pagamento.ValorTotal);
            cmd.Parameters.AddWithValue("@valorSinal", pagamento.ValorSinal);
            cmd.Parameters.AddWithValue("@saldoDevedor", pagamento.SaldoDevedor);
            cmd.Parameters.AddWithValue("@formaPgtoSinal", (object?)pagamento.FormaPgtoSinal ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@status", pagamento.Status);
            cmd.Parameters.AddWithValue("@formaPagamento", pagamento.FormaPagamento);
            cmd.Parameters.AddWithValue("@preferenceId", (object?)pagamento.PreferenceId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@mpPaymentId", (object?)pagamento.MpPaymentId ?? DBNull.Value);

            return cmd.ExecuteNonQuery() > 0;
        }

        public bool AtualizarStatus(int id, string status, string? formaPagamento = null, decimal? saldoDevedor = null)
        {
            var conexao = _context.GetConexao();
            using var cmd = conexao.CreateCommand();
            
            string sql = "UPDATE pagamento SET status = @status";
            cmd.Parameters.AddWithValue("@status", status);

            if (!string.IsNullOrEmpty(formaPagamento))
            {
                sql += ", forma_pagamento = @formaPagamento";
                cmd.Parameters.AddWithValue("@formaPagamento", formaPagamento);
            }

            if (saldoDevedor.HasValue)
            {
                sql += ", saldo_devedor = @saldoDevedor";
                cmd.Parameters.AddWithValue("@saldoDevedor", saldoDevedor.Value);
            }

            sql += " WHERE id = @id";
            cmd.Parameters.AddWithValue("@id", id);

            return cmd.ExecuteNonQuery() > 0;
        }

        public bool AtualizarMercadoPagoInfo(int id, string? preferenceId, long? mpPaymentId)
        {
            var conexao = _context.GetConexao();
            using var cmd = conexao.CreateCommand();
            cmd.CommandText = @"
                UPDATE pagamento SET 
                    preference_id = COALESCE(@preferenceId, preference_id),
                    mp_payment_id = COALESCE(@mpPaymentId, mp_payment_id)
                WHERE id = @id";

            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@preferenceId", (object?)preferenceId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@mpPaymentId", (object?)mpPaymentId ?? DBNull.Value);

            return cmd.ExecuteNonQuery() > 0;
        }

        public bool LiquidarSaldo(int encomendaId, string formaPagamento, int? caixaId)
        {
            GarantirTabelaExiste();
            var conexao = _context.GetConexao();

            // 1. Verifica se já existe um registro de pagamento para a encomenda
            using var cmdCheck = conexao.CreateCommand();
            cmdCheck.CommandText = "SELECT id FROM pagamento WHERE encomenda_id = @encomendaId ORDER BY id DESC LIMIT 1";
            cmdCheck.Parameters.AddWithValue("@encomendaId", encomendaId);
            var pagIdObj = cmdCheck.ExecuteScalar();

            if (pagIdObj != null)
            {
                using var cmdUpdate = conexao.CreateCommand();
                cmdUpdate.CommandText = @"
                    UPDATE pagamento SET 
                        saldo_devedor = 0.00,
                        status = 'pago',
                        forma_pagamento = @formaPagamento,
                        caixa_id = COALESCE(@caixaId, caixa_id)
                    WHERE id = @id";

                cmdUpdate.Parameters.AddWithValue("@id", Convert.ToInt32(pagIdObj));
                cmdUpdate.Parameters.AddWithValue("@formaPagamento", formaPagamento);
                cmdUpdate.Parameters.AddWithValue("@caixaId", (object?)caixaId ?? DBNull.Value);

                return cmdUpdate.ExecuteNonQuery() > 0;
            }
            else
            {
                // Inserir registro de pagamento para encomendas que ainda não possuíam
                using var cmdInsert = conexao.CreateCommand();
                cmdInsert.CommandText = @"
                    INSERT INTO pagamento (encomenda_id, valor_total, valor_sinal, saldo_devedor, status, forma_pagamento, caixa_id, data_criacao)
                    SELECT id, valor_total, 0.00, 0.00, 'pago', @formaPagamento, @caixaId, NOW() AT TIME ZONE 'UTC'
                    FROM encomenda
                    WHERE id = @encomendaId";

                cmdInsert.Parameters.AddWithValue("@encomendaId", encomendaId);
                cmdInsert.Parameters.AddWithValue("@formaPagamento", formaPagamento);
                cmdInsert.Parameters.AddWithValue("@caixaId", (object?)caixaId ?? DBNull.Value);

                return cmdInsert.ExecuteNonQuery() > 0;
            }
        }

        public List<BackEnd.Controllers.DTOS.PagamentoPendenteDTO> ObterPendentesRetirada()
        {
            GarantirTabelaExiste();
            var lista = new List<BackEnd.Controllers.DTOS.PagamentoPendenteDTO>();
            var conexao = _context.GetConexao();

            using var cmd = conexao.CreateCommand();
            cmd.CommandText = @"
                SELECT 
                    e.id as encomenda_id,
                    e.cliente_id,
                    COALESCE(c.nome, u.usuario_nome, 'Cliente Avulso') as cliente_nome,
                    COALESCE(c.cpf, 'Não informado') as cliente_cpf,
                    COALESCE(c.telefone, '') as cliente_telefone,
                    e.data_retirada,
                    e.valor_total,
                    COALESCE(p.saldo_devedor, e.valor_total) as saldo_devedor,
                    COALESCE(p.status, 'pendente') as status_pagamento,
                    COALESCE(p.forma_pagamento, 'A combinar / Balcão') as forma_pagamento,
                    e.observacao
                FROM encomenda e
                LEFT JOIN cliente c ON e.cliente_id = c.id
                LEFT JOIN usuario u ON e.usuario_id = u.id
                LEFT JOIN pagamento p ON p.encomenda_id = e.id
                WHERE (p.status IS NULL OR p.status = 'pendente' OR p.status = 'sinal_pago' OR COALESCE(p.saldo_devedor, e.valor_total) > 0)
                  AND e.status_enum != 3
                ORDER BY e.data_retirada ASC";

            using (var dr = cmd.ExecuteReader())
            {
                while (dr.Read())
                {
                    var item = new BackEnd.Controllers.DTOS.PagamentoPendenteDTO
                    {
                        EncomendaId = dr.GetInt32(dr.GetOrdinal("encomenda_id")),
                        ClienteId = dr.IsDBNull(dr.GetOrdinal("cliente_id")) ? null : dr.GetInt32(dr.GetOrdinal("cliente_id")),
                        ClienteNome = dr.IsDBNull(dr.GetOrdinal("cliente_nome")) ? "Cliente Avulso" : dr.GetString(dr.GetOrdinal("cliente_nome")),
                        ClienteCpf = dr.IsDBNull(dr.GetOrdinal("cliente_cpf")) ? "Não informado" : dr.GetString(dr.GetOrdinal("cliente_cpf")),
                        ClienteTelefone = dr.IsDBNull(dr.GetOrdinal("cliente_telefone")) ? "" : dr.GetString(dr.GetOrdinal("cliente_telefone")),
                        DataRetirada = dr.GetDateTime(dr.GetOrdinal("data_retirada")),
                        ValorTotal = dr.GetDecimal(dr.GetOrdinal("valor_total")),
                        SaldoDevedor = dr.GetDecimal(dr.GetOrdinal("saldo_devedor")),
                        StatusPagamento = dr.GetString(dr.GetOrdinal("status_pagamento")),
                        FormaPagamento = dr.GetString(dr.GetOrdinal("forma_pagamento")),
                        Observacao = dr.IsDBNull(dr.GetOrdinal("observacao")) ? null : dr.GetString(dr.GetOrdinal("observacao"))
                    };
                    lista.Add(item);
                }
            }

            // Buscar itens de cada encomenda pendente
            foreach (var dto in lista)
            {
                using var cmdItens = conexao.CreateCommand();
                cmdItens.CommandText = @"
                    SELECT ie.produto_id, pr.nome as produto_nome, ie.quantidade, ie.preco_no_ato as preco_unitario, ie.especificacoes_tecnicas
                    FROM item_encomenda ie
                    JOIN produto pr ON ie.produto_id = pr.id
                    WHERE ie.encomenda_id = @encId";
                cmdItens.Parameters.AddWithValue("@encId", dto.EncomendaId);

                using var drItens = cmdItens.ExecuteReader();
                while (drItens.Read())
                {
                    dto.Itens.Add(new BackEnd.Controllers.DTOS.ItemPendenteDTO
                    {
                        ProdutoId = drItens.GetInt32(drItens.GetOrdinal("produto_id")),
                        ProdutoNome = drItens.GetString(drItens.GetOrdinal("produto_nome")),
                        Quantidade = drItens.GetInt32(drItens.GetOrdinal("quantidade")),
                        PrecoUnitario = drItens.GetDecimal(drItens.GetOrdinal("preco_unitario")),
                        EspecificacoesTecnicas = drItens.IsDBNull(drItens.GetOrdinal("especificacoes_tecnicas")) ? null : drItens.GetString(drItens.GetOrdinal("especificacoes_tecnicas"))
                    });
                }
            }

            return lista;
        }

        public BackEnd.Controllers.DTOS.DashboardResponseDTO ObterDadosDashboard(DateTime? dataInicio, DateTime? dataFim)
        {
            GarantirTabelaExiste();
            var result = new BackEnd.Controllers.DTOS.DashboardResponseDTO();
            var conexao = _context.GetConexao();

            DateTime inicio = dataInicio ?? new DateTime(DateTime.Now.Year, 1, 1);
            DateTime fim = dataFim ?? DateTime.Now.Date.AddDays(1).AddTicks(-1);

            if (dataFim.HasValue && dataFim.Value.TimeOfDay == TimeSpan.Zero)
            {
                fim = dataFim.Value.Date.AddDays(1).AddTicks(-1);
            }

            // 1. KPIs: Total Faturamento, Total Encomendas, Pendente a Receber
            using (var cmdKpi = conexao.CreateCommand())
            {
                cmdKpi.CommandText = @"
                    SELECT 
                        COALESCE(SUM(CASE WHEN p.status = 'pago' THEN e.valor_total WHEN p.status = 'sinal_pago' THEN p.valor_sinal ELSE (e.valor_total - COALESCE(p.saldo_devedor, e.valor_total)) END), 0) as faturamento_total,
                        COUNT(DISTINCT e.id) as total_encomendas,
                        COALESCE(SUM(CASE WHEN e.status_enum != 3 AND (p.status IS NULL OR p.status = 'pendente' OR p.saldo_devedor > 0) THEN COALESCE(p.saldo_devedor, e.valor_total) ELSE 0 END), 0) as pendente_receber
                    FROM encomenda e
                    LEFT JOIN pagamento p ON p.encomenda_id = e.id
                    WHERE e.status_enum != 3
                      AND e.data_retirada >= @inicio AND e.data_retirada <= @fim";

                cmdKpi.Parameters.AddWithValue("@inicio", inicio);
                cmdKpi.Parameters.AddWithValue("@fim", fim);

                using var dr = cmdKpi.ExecuteReader();
                if (dr.Read())
                {
                    result.FaturamentoTotal = dr.GetDecimal(dr.GetOrdinal("faturamento_total"));
                    result.TotalEncomendas = dr.GetInt32(dr.GetOrdinal("total_encomendas"));
                    result.PendenteAReceber = dr.GetDecimal(dr.GetOrdinal("pendente_receber"));
                    result.TicketMedio = result.TotalEncomendas > 0 ? Math.Round(result.FaturamentoTotal / result.TotalEncomendas, 2) : 0m;
                }
            }

            // 2. Ranking de Produtos Mais Vendidos
            using (var cmdProd = conexao.CreateCommand())
            {
                cmdProd.CommandText = @"
                    SELECT 
                        ie.produto_id, 
                        pr.nome as produto_nome, 
                        SUM(ie.quantidade) as qtd_vendida, 
                        SUM(ie.quantidade * ie.preco_no_ato) as total_arrecadado
                    FROM item_encomenda ie
                    JOIN encomenda e ON ie.encomenda_id = e.id
                    JOIN produto pr ON ie.produto_id = pr.id
                    WHERE e.status_enum != 3
                      AND e.data_retirada >= @inicio AND e.data_retirada <= @fim
                    GROUP BY ie.produto_id, pr.nome
                    ORDER BY qtd_vendida DESC
                    LIMIT 10";

                cmdProd.Parameters.AddWithValue("@inicio", inicio);
                cmdProd.Parameters.AddWithValue("@fim", fim);

                using var dr = cmdProd.ExecuteReader();
                while (dr.Read())
                {
                    result.ProdutosMaisVendidos.Add(new BackEnd.Controllers.DTOS.ProdutoMaisVendidoDTO
                    {
                        ProdutoId = dr.GetInt32(dr.GetOrdinal("produto_id")),
                        ProdutoNome = dr.GetString(dr.GetOrdinal("produto_nome")),
                        QuantidadeVendida = Convert.ToInt32(dr.GetInt64(dr.GetOrdinal("qtd_vendida"))),
                        ValorArrecadado = dr.GetDecimal(dr.GetOrdinal("total_arrecadado"))
                    });
                }
            }

            // 3. Proporção por Forma de Pagamento e Faturamento por Categoria Financeira
            using (var cmdForma = conexao.CreateCommand())
            {
                cmdForma.CommandText = @"
                    SELECT 
                        COALESCE(NULLIF(TRIM(p.forma_pagamento), ''), 'Balcão / Presencial') as forma_pagamento, 
                        COUNT(*) as quantidade, 
                        SUM(CASE WHEN p.status = 'pago' THEN e.valor_total WHEN p.status = 'sinal_pago' THEN p.valor_sinal ELSE (e.valor_total - COALESCE(p.saldo_devedor, e.valor_total)) END) as valor_total
                    FROM encomenda e
                    LEFT JOIN pagamento p ON p.encomenda_id = e.id
                    WHERE e.status_enum != 3
                      AND (p.status = 'pago' OR p.status = 'sinal_pago')
                      AND e.data_retirada >= @inicio AND e.data_retirada <= @fim
                    GROUP BY COALESCE(NULLIF(TRIM(p.forma_pagamento), ''), 'Balcão / Presencial')
                    ORDER BY valor_total DESC";

                cmdForma.Parameters.AddWithValue("@inicio", inicio);
                cmdForma.Parameters.AddWithValue("@fim", fim);

                using var dr = cmdForma.ExecuteReader();
                while (dr.Read())
                {
                    string forma = dr.GetString(dr.GetOrdinal("forma_pagamento"));
                    int qtd = Convert.ToInt32(dr.GetInt64(dr.GetOrdinal("quantidade")));
                    decimal total = dr.GetDecimal(dr.GetOrdinal("valor_total"));

                    result.PagamentosPorForma.Add(new BackEnd.Controllers.DTOS.PagamentoFormaDTO
                    {
                        FormaPagamento = forma,
                        Quantidade = qtd,
                        ValorTotal = total
                    });

                    string formaLower = forma.ToLower();
                    if (formaLower.Contains("dinheiro"))
                    {
                        result.FaturamentoDinheiro += total;
                    }
                    else if (formaLower.Contains("cart") || formaLower.Contains("crédito") || formaLower.Contains("débito"))
                    {
                        result.FaturamentoCartao += total;
                    }
                    else if (formaLower.Contains("pix"))
                    {
                        result.FaturamentoPix += total;
                    }
                    else if (formaLower.Contains("mercado pago"))
                    {
                        result.FaturamentoMercadoPago += total;
                    }
                }
            }

            // 4. Evolução do Faturamento por Dia
            using (var cmdDia = conexao.CreateCommand())
            {
                cmdDia.CommandText = @"
                    SELECT 
                        TO_CHAR(e.data_retirada, 'YYYY-MM-DD') as dia_str, 
                        SUM(CASE WHEN p.status = 'pago' THEN e.valor_total WHEN p.status = 'sinal_pago' THEN p.valor_sinal ELSE (e.valor_total - COALESCE(p.saldo_devedor, e.valor_total)) END) as valor_dia, 
                        COUNT(DISTINCT e.id) as qtd_dia
                    FROM encomenda e
                    LEFT JOIN pagamento p ON p.encomenda_id = e.id
                    WHERE e.status_enum != 3
                      AND (p.status = 'pago' OR p.status = 'sinal_pago')
                      AND e.data_retirada >= @inicio AND e.data_retirada <= @fim
                    GROUP BY TO_CHAR(e.data_retirada, 'YYYY-MM-DD')
                    ORDER BY dia_str ASC";

                cmdDia.Parameters.AddWithValue("@inicio", inicio);
                cmdDia.Parameters.AddWithValue("@fim", fim);

                using var dr = cmdDia.ExecuteReader();
                while (dr.Read())
                {
                    result.EvolucaoFaturamento.Add(new BackEnd.Controllers.DTOS.EvolucaoDiaDTO
                    {
                        Data = dr.GetString(dr.GetOrdinal("dia_str")),
                        ValorTotal = dr.GetDecimal(dr.GetOrdinal("valor_dia")),
                        TotalEncomendas = Convert.ToInt32(dr.GetInt64(dr.GetOrdinal("qtd_dia")))
                    });
                }
            }

            return result;
        }

        private static Pagamento MapearPagamento(NpgsqlDataReader dr)
        {
            return new Pagamento
            {
                Id = dr.GetInt32(dr.GetOrdinal("id")),
                EncomendaId = dr.GetInt32(dr.GetOrdinal("encomenda_id")),
                CaixaId = dr.IsDBNull(dr.GetOrdinal("caixa_id")) ? null : dr.GetInt32(dr.GetOrdinal("caixa_id")),
                ValorTotal = dr.IsDBNull(dr.GetOrdinal("valor_total")) ? 0m : dr.GetDecimal(dr.GetOrdinal("valor_total")),
                ValorSinal = dr.IsDBNull(dr.GetOrdinal("valor_sinal")) ? 0m : dr.GetDecimal(dr.GetOrdinal("valor_sinal")),
                SaldoDevedor = dr.IsDBNull(dr.GetOrdinal("saldo_devedor")) ? 0m : dr.GetDecimal(dr.GetOrdinal("saldo_devedor")),
                FormaPgtoSinal = dr.IsDBNull(dr.GetOrdinal("forma_pagamento_sinal")) ? null : dr.GetString(dr.GetOrdinal("forma_pagamento_sinal")),
                Status = dr.IsDBNull(dr.GetOrdinal("status")) ? "pendente" : dr.GetString(dr.GetOrdinal("status")),
                FormaPagamento = dr.IsDBNull(dr.GetOrdinal("forma_pagamento")) ? "Não informada" : dr.GetString(dr.GetOrdinal("forma_pagamento")),
                PreferenceId = dr.IsDBNull(dr.GetOrdinal("preference_id")) ? null : dr.GetString(dr.GetOrdinal("preference_id")),
                MpPaymentId = dr.IsDBNull(dr.GetOrdinal("mp_payment_id")) ? null : dr.GetInt64(dr.GetOrdinal("mp_payment_id")),
                DataCriacao = dr.IsDBNull(dr.GetOrdinal("data_criacao")) ? DateTime.UtcNow : dr.GetDateTime(dr.GetOrdinal("data_criacao"))
            };
        }
    }
}
