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
                        cmdItem.CommandText = @"INSERT INTO item_encomenda (encomenda_id, produto_id, quantidade, preco_no_ato) 
                                               VALUES (@encId, @prodId, @qtd, @preco)";

                        cmdItem.Parameters.AddWithValue("@encId", encomenda.Id);
                        cmdItem.Parameters.AddWithValue("@prodId", item.ProdutoId);
                        cmdItem.Parameters.AddWithValue("@qtd", item.Quantidade);
                        cmdItem.Parameters.AddWithValue("@preco", item.PrecoUnitario);

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
                        cmdItem.CommandText = @"INSERT INTO item_encomenda (encomenda_id, produto_id, quantidade, preco_no_ato) 
                                               VALUES (@encId, @prodId, @qtd, @preco)";

                        cmdItem.Parameters.AddWithValue("@encId", encomenda.Id);
                        cmdItem.Parameters.AddWithValue("@prodId", item.ProdutoId);
                        cmdItem.Parameters.AddWithValue("@qtd", item.Quantidade);
                        cmdItem.Parameters.AddWithValue("@preco", item.PrecoUnitario);

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

            // Auto-completa encomendas que o horário já passou
            using var cmdUpdate = conexao.CreateCommand();
            cmdUpdate.CommandText = "UPDATE encomenda SET status_enum = 2 WHERE status_enum < 2 AND data_retirada <= NOW()";
            cmdUpdate.ExecuteNonQuery();

            using var cmd = conexao.CreateCommand();
            cmd.CommandText = @"SELECT e.*, COALESCE(c.nome, u.usuario_nome) as cliente_nome, COALESCE(c.telefone, '') as cliente_telefone
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
                enc.ClienteNome = dr.IsDBNull(dr.GetOrdinal("cliente_nome")) ? "Cliente Avulso" : dr.GetString(dr.GetOrdinal("cliente_nome"));
                enc.ClienteTelefone = dr.IsDBNull(dr.GetOrdinal("cliente_telefone")) ? "" : dr.GetString(dr.GetOrdinal("cliente_telefone"));
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
    }
}