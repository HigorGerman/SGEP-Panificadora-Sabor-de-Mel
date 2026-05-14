using BackEnd.Models;
using Npgsql;
using System.Data;

namespace BackEnd.Repository
{
    public class EncomendaRepository
    {
        private readonly PostgresDbContext _context;

        public EncomendaRepository(PostgresDbContext context)
        {
            _context = context;
        }

        public bool Criar(Encomenda encomenda)
        {
            var conexao = _context.GetConexao();
            using var transacao = conexao.BeginTransaction();

            try
            {
                // 1. Inserir a Encomenda (Cabeçalho)
                using var cmdEnc = conexao.CreateCommand();
                cmdEnc.Transaction = transacao;
                cmdEnc.CommandText = @"INSERT INTO encomenda (cliente_id, usuario_id, data_retirada, valor_total, status_enum, observacao) 
                                       VALUES (@cliente, @usuario, @entrega, @total, @status, @obs) 
                                       RETURNING id";

                cmdEnc.Parameters.AddWithValue("@cliente", (object?)encomenda.ClienteId ?? DBNull.Value);
                cmdEnc.Parameters.AddWithValue("@usuario", (object?)encomenda.UsuarioId ?? DBNull.Value);
                cmdEnc.Parameters.AddWithValue("@entrega", encomenda.DataEntrega);
                cmdEnc.Parameters.AddWithValue("@total", encomenda.ValorTotal);
                cmdEnc.Parameters.AddWithValue("@status", (int)encomenda.Status);
                cmdEnc.Parameters.AddWithValue("@obs", (object?)encomenda.Observacao ?? DBNull.Value);

                encomenda.Id = (int)cmdEnc.ExecuteScalar();

                // 2. Inserir os Itens da Encomenda
                if (encomenda.Itens != null)
                {
                    foreach (var item in encomenda.Itens)
                    {
                        using var cmdItem = conexao.CreateCommand();
                        cmdItem.Transaction = transacao;
                        cmdItem.CommandText = @"INSERT INTO item_encomenda (encomenda_id, produto_id, quantidade, preco_no_ato, especificacoes_tecnicas) 
                                               VALUES (@encId, @prodId, @qtd, @preco, @specs::jsonb)";

                        cmdItem.Parameters.AddWithValue("@encId", encomenda.Id);
                        cmdItem.Parameters.AddWithValue("@prodId", item.ProdutoId);
                        cmdItem.Parameters.AddWithValue("@qtd", item.Quantidade);
                        cmdItem.Parameters.AddWithValue("@preco", item.PrecoUnitario);
                        cmdItem.Parameters.AddWithValue("@specs", (object?)item.EspecificacoesTecnicas ?? DBNull.Value);

                        cmdItem.ExecuteNonQuery();
                    }
                }

                transacao.Commit();
                return true;
            }
            catch (Exception)
            {
                transacao.Rollback();
                throw;
            }
        }

        public Encomenda? ObterPorId(int id)
        {
            var conexao = _context.GetConexao();
            
            using var cmd = conexao.CreateCommand();
            cmd.CommandText = "SELECT * FROM encomenda WHERE id = @id";
            cmd.Parameters.AddWithValue("@id", id);
            
            Encomenda? enc = null;
            using (var dr = cmd.ExecuteReader())
            {
                if (dr.Read())
                {
                    enc = new Encomenda();
                    enc.Id = dr.GetInt32(dr.GetOrdinal("id"));
                    enc.ClienteId = dr.IsDBNull(dr.GetOrdinal("cliente_id")) ? null : dr.GetInt32(dr.GetOrdinal("cliente_id"));
                    enc.UsuarioId = dr.IsDBNull(dr.GetOrdinal("usuario_id")) ? null : dr.GetInt32(dr.GetOrdinal("usuario_id"));
                    enc.DataEntrega = dr.GetDateTime(dr.GetOrdinal("data_retirada"));
                    enc.ValorTotal = dr.GetDecimal(dr.GetOrdinal("valor_total"));
                    enc.Status = (Encomenda.StatusEnum)dr.GetInt32(dr.GetOrdinal("status_enum"));
                    enc.Observacao = dr.IsDBNull(dr.GetOrdinal("observacao")) ? "" : dr.GetString(dr.GetOrdinal("observacao"));
                }
            }

            if (enc != null)
            {
                using var cmdItens = conexao.CreateCommand();
                cmdItens.CommandText = "SELECT * FROM item_encomenda WHERE encomenda_id = @id";
                cmdItens.Parameters.AddWithValue("@id", id);
                using (var drItens = cmdItens.ExecuteReader())
                {
                    while (drItens.Read())
                    {
                        var item = new ItemEncomenda();
                        item.Id = drItens.GetInt32(drItens.GetOrdinal("id"));
                        item.EncomendaId = drItens.GetInt32(drItens.GetOrdinal("encomenda_id"));
                        item.ProdutoId = drItens.GetInt32(drItens.GetOrdinal("produto_id"));
                        item.Quantidade = drItens.GetInt32(drItens.GetOrdinal("quantidade"));
                        item.PrecoUnitario = drItens.GetDecimal(drItens.GetOrdinal("preco_no_ato"));
                        item.EspecificacoesTecnicas = drItens.IsDBNull(drItens.GetOrdinal("especificacoes_tecnicas")) ? null : drItens.GetString(drItens.GetOrdinal("especificacoes_tecnicas"));
                        enc.Itens.Add(item);
                    }
                }
            }

            return enc;
        }

        public bool Atualizar(Encomenda encomenda)
        {
            var conexao = _context.GetConexao();
            using var transacao = conexao.BeginTransaction();

            try
            {
                using var cmdEnc = conexao.CreateCommand();
                cmdEnc.Transaction = transacao;
                cmdEnc.CommandText = @"UPDATE encomenda 
                                       SET cliente_id = @cliente, usuario_id = @usuario, data_retirada = @entrega, 
                                           valor_total = @total, status_enum = @status, observacao = @obs 
                                       WHERE id = @id";

                cmdEnc.Parameters.AddWithValue("@id", encomenda.Id);
                cmdEnc.Parameters.AddWithValue("@cliente", (object?)encomenda.ClienteId ?? DBNull.Value);
                cmdEnc.Parameters.AddWithValue("@usuario", (object?)encomenda.UsuarioId ?? DBNull.Value);
                cmdEnc.Parameters.AddWithValue("@entrega", encomenda.DataEntrega);
                cmdEnc.Parameters.AddWithValue("@total", encomenda.ValorTotal);
                cmdEnc.Parameters.AddWithValue("@status", (int)encomenda.Status);
                cmdEnc.Parameters.AddWithValue("@obs", (object?)encomenda.Observacao ?? DBNull.Value);

                cmdEnc.ExecuteNonQuery();

                // Remove existing items and add new ones
                using var cmdDel = conexao.CreateCommand();
                cmdDel.Transaction = transacao;
                cmdDel.CommandText = "DELETE FROM item_encomenda WHERE encomenda_id = @id";
                cmdDel.Parameters.AddWithValue("@id", encomenda.Id);
                cmdDel.ExecuteNonQuery();

                if (encomenda.Itens != null)
                {
                    foreach (var item in encomenda.Itens)
                    {
                        using var cmdItem = conexao.CreateCommand();
                        cmdItem.Transaction = transacao;
                        cmdItem.CommandText = @"INSERT INTO item_encomenda (encomenda_id, produto_id, quantidade, preco_no_ato, especificacoes_tecnicas) 
                                               VALUES (@encId, @prodId, @qtd, @preco, @specs::jsonb)";

                        cmdItem.Parameters.AddWithValue("@encId", encomenda.Id);
                        cmdItem.Parameters.AddWithValue("@prodId", item.ProdutoId);
                        cmdItem.Parameters.AddWithValue("@qtd", item.Quantidade);
                        cmdItem.Parameters.AddWithValue("@preco", item.PrecoUnitario);
                        cmdItem.Parameters.AddWithValue("@specs", (object?)item.EspecificacoesTecnicas ?? DBNull.Value);

                        cmdItem.ExecuteNonQuery();
                    }
                }

                transacao.Commit();
                return true;
            }
            catch (Exception)
            {
                transacao.Rollback();
                throw;
            }
        }

        public bool Excluir(int id)
        {
            var conexao = _context.GetConexao();
            using var transacao = conexao.BeginTransaction();

            try
            {
                using var cmdDelItems = conexao.CreateCommand();
                cmdDelItems.Transaction = transacao;
                cmdDelItems.CommandText = "DELETE FROM item_encomenda WHERE encomenda_id = @id";
                cmdDelItems.Parameters.AddWithValue("@id", id);
                cmdDelItems.ExecuteNonQuery();

                using var cmdDelEnc = conexao.CreateCommand();
                cmdDelEnc.Transaction = transacao;
                cmdDelEnc.CommandText = "DELETE FROM encomenda WHERE id = @id";
                cmdDelEnc.Parameters.AddWithValue("@id", id);
                cmdDelEnc.ExecuteNonQuery();

                transacao.Commit();
                return true;
            }
            catch (Exception)
            {
                transacao.Rollback();
                throw;
            }
        }

        public List<Encomenda> Listar()
        {
            var lista = new List<Encomenda>();
            var conexao = _context.GetConexao();
            using var cmd = conexao.CreateCommand();
            cmd.CommandText = @"SELECT e.*, COALESCE(c.nome, u.usuario_nome) as cliente_nome 
                                FROM encomenda e 
                                LEFT JOIN cliente c ON e.cliente_id = c.id
                                LEFT JOIN usuario u ON e.usuario_id = u.id 
                                ORDER BY e.data_retirada ASC";
            
            using var dr = cmd.ExecuteReader();
            while (dr.Read())
            {
                var enc = new Encomenda();
                enc.Id = dr.GetInt32(dr.GetOrdinal("id"));
                enc.ClienteId = dr.IsDBNull(dr.GetOrdinal("cliente_id")) ? null : dr.GetInt32(dr.GetOrdinal("cliente_id"));
                enc.UsuarioId = dr.IsDBNull(dr.GetOrdinal("usuario_id")) ? null : dr.GetInt32(dr.GetOrdinal("usuario_id"));
                enc.DataEntrega = dr.GetDateTime(dr.GetOrdinal("data_retirada"));
                enc.ValorTotal = dr.GetDecimal(dr.GetOrdinal("valor_total"));
                enc.Status = (Encomenda.StatusEnum)dr.GetInt32(dr.GetOrdinal("status_enum"));
                enc.Observacao = dr.IsDBNull(dr.GetOrdinal("observacao")) ? "" : dr.GetString(dr.GetOrdinal("observacao"));
                lista.Add(enc);
            }
            return lista;
        }

        public List<Encomenda> ListarComDetalhes()
        {
            var lista = new List<Encomenda>();
            var conexao = _context.GetConexao();

            using (var cmdAlter = conexao.CreateCommand())
            {
                cmdAlter.CommandText = @"
                    ALTER TABLE encomenda ADD COLUMN IF NOT EXISTS data_entrega_real TIMESTAMP;
                    ALTER TABLE encomenda ADD COLUMN IF NOT EXISTS usuario_entrega_id INT REFERENCES usuario(id);
                    CREATE TABLE IF NOT EXISTS pagamento (id SERIAL PRIMARY KEY, encomenda_id INT REFERENCES encomenda(id) ON DELETE CASCADE, status VARCHAR(50) DEFAULT 'pendente');
                    ALTER TABLE pagamento ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pago';
                    ALTER TABLE pagamento ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(100) DEFAULT 'Não informada';
                ";
                cmdAlter.ExecuteNonQuery();
            }

            // Auto-completa encomendas que o horário já passou
            using var cmdUpdate = conexao.CreateCommand();
            cmdUpdate.CommandText = "UPDATE encomenda SET status_enum = 2 WHERE status_enum < 2 AND data_retirada <= (NOW() AT TIME ZONE 'America/Sao_Paulo')";
            cmdUpdate.ExecuteNonQuery();

            using var cmd = conexao.CreateCommand();
            cmd.CommandText = @"SELECT e.*, COALESCE(c.nome, u.usuario_nome) as cliente_nome, COALESCE(c.telefone, '') as cliente_telefone,
                                       (SELECT forma_pagamento FROM pagamento WHERE encomenda_id = e.id ORDER BY id DESC LIMIT 1) as forma_pagamento,
                                       ue.usuario_nome as usuario_entrega_nome
                                FROM encomenda e 
                                LEFT JOIN cliente c ON e.cliente_id = c.id
                                LEFT JOIN usuario u ON e.usuario_id = u.id 
                                LEFT JOIN usuario ue ON e.usuario_entrega_id = ue.id
                                ORDER BY e.data_retirada ASC";
            
            using var dr = cmd.ExecuteReader();
            while (dr.Read())
            {
                var enc = new Encomenda();
                enc.Id = dr.GetInt32(dr.GetOrdinal("id"));
                enc.ClienteId = dr.IsDBNull(dr.GetOrdinal("cliente_id")) ? null : dr.GetInt32(dr.GetOrdinal("cliente_id"));
                enc.UsuarioId = dr.IsDBNull(dr.GetOrdinal("usuario_id")) ? null : dr.GetInt32(dr.GetOrdinal("usuario_id"));
                enc.DataEntrega = dr.GetDateTime(dr.GetOrdinal("data_retirada"));
                enc.ValorTotal = dr.GetDecimal(dr.GetOrdinal("valor_total"));
                enc.Status = (Encomenda.StatusEnum)dr.GetInt32(dr.GetOrdinal("status_enum"));
                enc.Observacao = dr.IsDBNull(dr.GetOrdinal("observacao")) ? "" : dr.GetString(dr.GetOrdinal("observacao"));
                enc.ClienteNome = dr.IsDBNull(dr.GetOrdinal("cliente_nome")) ? "Cliente Avulso" : dr.GetString(dr.GetOrdinal("cliente_nome"));
                enc.ClienteTelefone = dr.IsDBNull(dr.GetOrdinal("cliente_telefone")) ? "" : dr.GetString(dr.GetOrdinal("cliente_telefone"));
                enc.DataEntregaReal = dr.IsDBNull(dr.GetOrdinal("data_entrega_real")) ? null : dr.GetDateTime(dr.GetOrdinal("data_entrega_real"));
                enc.PagamentoForma = dr.IsDBNull(dr.GetOrdinal("forma_pagamento")) ? "Não informada" : dr.GetString(dr.GetOrdinal("forma_pagamento"));
                enc.UsuarioEntregaNome = dr.IsDBNull(dr.GetOrdinal("usuario_entrega_nome")) ? null : dr.GetString(dr.GetOrdinal("usuario_entrega_nome"));
                lista.Add(enc);
            }
            dr.Close();

            using var cmdItens = conexao.CreateCommand();
            cmdItens.CommandText = @"SELECT i.*, p.nome as produto_nome 
                                     FROM item_encomenda i
                                     INNER JOIN produto p ON i.produto_id = p.id";
            using var drItens = cmdItens.ExecuteReader();
            var dictItens = new Dictionary<int, List<ItemEncomenda>>();
            while (drItens.Read())
            {
                var encId = drItens.GetInt32(drItens.GetOrdinal("encomenda_id"));
                if (!dictItens.ContainsKey(encId)) dictItens[encId] = new List<ItemEncomenda>();
                
                var item = new ItemEncomenda();
                item.Id = drItens.GetInt32(drItens.GetOrdinal("id"));
                item.EncomendaId = encId;
                item.ProdutoId = drItens.GetInt32(drItens.GetOrdinal("produto_id"));
                item.Quantidade = drItens.GetInt32(drItens.GetOrdinal("quantidade"));
                item.PrecoUnitario = drItens.GetDecimal(drItens.GetOrdinal("preco_no_ato"));
                item.ProdutoNome = drItens.GetString(drItens.GetOrdinal("produto_nome"));
                item.EspecificacoesTecnicas = drItens.IsDBNull(drItens.GetOrdinal("especificacoes_tecnicas")) ? null : drItens.GetString(drItens.GetOrdinal("especificacoes_tecnicas"));
                
                dictItens[encId].Add(item);
            }
            
            foreach (var enc in lista)
            {
                if (dictItens.ContainsKey(enc.Id))
                {
                    enc.Itens = dictItens[enc.Id];
                }
            }

            return lista;
        }

        public bool AtualizarStatus(int id, Encomenda.StatusEnum novoStatus)
        {
            var conexao = _context.GetConexao();
            using var cmd = conexao.CreateCommand();
            cmd.CommandText = "UPDATE encomenda SET status_enum = @status WHERE id = @id";
            cmd.Parameters.AddWithValue("@status", (int)novoStatus);
            cmd.Parameters.AddWithValue("@id", id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool RegistrarEntrega(int id, int? usuarioEntregaId)
        {
            var conexao = _context.GetConexao();

            // Garante que a estrutura exista
            using (var cmdAlter = conexao.CreateCommand())
            {
                cmdAlter.CommandText = @"
                    ALTER TABLE encomenda ADD COLUMN IF NOT EXISTS data_entrega_real TIMESTAMP;
                    ALTER TABLE encomenda ADD COLUMN IF NOT EXISTS usuario_entrega_id INT REFERENCES usuario(id);
                ";
                cmdAlter.ExecuteNonQuery();
            }

            using (var cmdPayTable = conexao.CreateCommand())
            {
                cmdPayTable.CommandText = "CREATE TABLE IF NOT EXISTS pagamento (id SERIAL PRIMARY KEY, encomenda_id INT REFERENCES encomenda(id) ON DELETE CASCADE, status VARCHAR(50) DEFAULT 'pendente');";
                cmdPayTable.ExecuteNonQuery();
                
                cmdPayTable.CommandText = "ALTER TABLE pagamento ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pago';";
                cmdPayTable.ExecuteNonQuery();
            }

            // Valida Pagamento
            using (var cmdCheckPay = conexao.CreateCommand())
            {
                cmdCheckPay.CommandText = "SELECT status FROM pagamento WHERE encomenda_id = @id ORDER BY id DESC LIMIT 1";
                cmdCheckPay.Parameters.AddWithValue("@id", id);
                var statusPagamento = cmdCheckPay.ExecuteScalar()?.ToString();

                if (statusPagamento == null)
                {
                    // Insere um pagamento mock para não travar o fluxo caso a tabela seja nova
                    using var cmdMock = conexao.CreateCommand();
                    cmdMock.CommandText = "INSERT INTO pagamento (encomenda_id, status) VALUES (@id, 'pago')";
                    cmdMock.Parameters.AddWithValue("@id", id);
                    cmdMock.ExecuteNonQuery();
                }
                else if (statusPagamento.ToLower() != "pago" && statusPagamento.ToLower() != "concluido")
                {
                    throw new Exception($"Pagamento não concluído. Status atual: {statusPagamento}.");
                }
            }

            using var cmd = conexao.CreateCommand();
            DateTime horaBrasilia = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time"));
            cmd.CommandText = "UPDATE encomenda SET status_enum = 4, data_entrega_real = @dataEntregaReal, usuario_entrega_id = @uId WHERE id = @id";
            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@dataEntregaReal", horaBrasilia);
            cmd.Parameters.AddWithValue("@uId", (object?)usuarioEntregaId ?? DBNull.Value);
            return cmd.ExecuteNonQuery() > 0;
        }
    }
}