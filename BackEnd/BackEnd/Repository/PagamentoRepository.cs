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
            var conexao = _context.GetConexao();
            using var cmd = conexao.CreateCommand();
            cmd.CommandText = @"
                UPDATE pagamento SET 
                    saldo_devedor = 0.00,
                    status = 'pago',
                    forma_pagamento = @formaPagamento,
                    caixa_id = COALESCE(@caixaId, caixa_id)
                WHERE encomenda_id = @encomendaId";

            cmd.Parameters.AddWithValue("@encomendaId", encomendaId);
            cmd.Parameters.AddWithValue("@formaPagamento", formaPagamento);
            cmd.Parameters.AddWithValue("@caixaId", (object?)caixaId ?? DBNull.Value);

            return cmd.ExecuteNonQuery() > 0;
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
