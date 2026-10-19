using BackEnd.Controllers.DTOS;
using BackEnd.Models;
using Npgsql;
using System.Data;

namespace BackEnd.Repository
{
    public class ClienteRepository
    {
        private readonly PostgresDbContext _context;

        public ClienteRepository(PostgresDbContext context)
        {
            _context = context;
            GarantirColunasInadimplencia();
        }

        private void GarantirColunasInadimplencia()
        {
            try
            {
                var conn = _context.GetConexao();
                if (conn.State != ConnectionState.Open) conn.Open();

                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"
                    ALTER TABLE cliente ADD COLUMN IF NOT EXISTS bloqueado_encomendas BOOLEAN DEFAULT FALSE;
                    ALTER TABLE cliente ADD COLUMN IF NOT EXISTS motivo_bloqueio VARCHAR(255);
                ";
                cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Aviso ao garantir colunas de inadimplencia na tabela cliente: " + ex.Message);
            }
        }

        public bool Criar(Cliente cliente)
        {
            try
            {
                var conn = _context.GetConexao();
        
                // Garante que a conexão esteja aberta
                if (conn.State != ConnectionState.Open) conn.Open();

                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"INSERT INTO cliente (nome, cpf, email, senha, telefone, 
                            restricao_gluten, restricao_lactose, restricao_acucar, ativo) 
                            VALUES (@nome, @cpf, @email, @senha, @telefone, 
                            @gluten, @lactose, @acucar, true) 
                            RETURNING id";

                // Limpa parâmetros para evitar duplicação se houver retry
                cmd.Parameters.Clear();
                cmd.Parameters.AddWithValue("@nome", cliente.Nome ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@cpf", (object?)cliente.Cpf ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@email", (object?)cliente.Email ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@senha", cliente.Senha != null ? BCrypt.Net.BCrypt.HashPassword(cliente.Senha) : DBNull.Value);
                cmd.Parameters.AddWithValue("@telefone", (object?)cliente.Telefone ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@gluten", cliente.RestricaoGluten);
                cmd.Parameters.AddWithValue("@lactose", cliente.RestricaoLactose);
                cmd.Parameters.AddWithValue("@acucar", cliente.RestricaoAcucar);

                var result = cmd.ExecuteScalar();
                if (result != null)
                {
                    cliente.Id = Convert.ToInt32(result);
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                // ISSO AQUI É O MAIS IMPORTANTE: 
                // No Rider, olhe a aba 'Output' ou 'Terminal'. 
                // A mensagem real do erro vai aparecer lá agora!
                Console.WriteLine(">>>> ERRO CRÍTICO NO POSTGRES: " + ex.Message);
                return false; 
            }
        }
        
        public Cliente? ObterPorEmailESenha(string email, string senha)
        {
            try
            {
                using var cmd = _context.GetConexao().CreateCommand();
                cmd.CommandText = "SELECT * FROM cliente WHERE email = @email AND ativo = true LIMIT 1";
                cmd.Parameters.AddWithValue("@email", email);

                using var dr = cmd.ExecuteReader();
        
                if (dr.Read())
                {
                    var cliente = Map(dr);
                    if (cliente.Senha == null) return null;
                    
                    string hashNoBanco = cliente.Senha;
                    bool isBcrypt = hashNoBanco.StartsWith("$2a$") || hashNoBanco.StartsWith("$2b$") || hashNoBanco.StartsWith("$2y$");
                    
                    if (isBcrypt)
                    {
                        if (BCrypt.Net.BCrypt.Verify(senha, hashNoBanco))
                        {
                            return cliente;
                        }
                    }
                    else
                    {
                        if (hashNoBanco == senha)
                        {
                            dr.Close();
                            using var cmdUpdate = _context.GetConexao().CreateCommand();
                            cmdUpdate.CommandText = "UPDATE cliente SET senha = @novaSenha WHERE id = @id";
                            string newHash = BCrypt.Net.BCrypt.HashPassword(senha);
                            cmdUpdate.Parameters.AddWithValue("@novaSenha", newHash);
                            cmdUpdate.Parameters.AddWithValue("@id", cliente.Id);
                            cmdUpdate.ExecuteNonQuery();
                            
                            cliente.Senha = newHash;
                            return cliente;
                        }
                    }
                }
        
                return null;
            }
            catch (Exception)
            {
                throw;
            }
        }

        public Cliente Map(NpgsqlDataReader dr)
        {
            var c = new Cliente();
            c.Id = dr.GetInt32(dr.GetOrdinal("id"));
            c.Nome = dr.GetString(dr.GetOrdinal("nome"));
            c.Cpf = dr.IsDBNull(dr.GetOrdinal("cpf")) ? null : dr.GetString(dr.GetOrdinal("cpf"));
            c.Email = dr.IsDBNull(dr.GetOrdinal("email")) ? null : dr.GetString(dr.GetOrdinal("email"));
            c.Senha = dr.IsDBNull(dr.GetOrdinal("senha")) ? null : dr.GetString(dr.GetOrdinal("senha"));
            c.Telefone = dr.IsDBNull(dr.GetOrdinal("telefone")) ? null : dr.GetString(dr.GetOrdinal("telefone"));
            c.RestricaoGluten = dr.GetBoolean(dr.GetOrdinal("restricao_gluten"));
            c.RestricaoLactose = dr.GetBoolean(dr.GetOrdinal("restricao_lactose"));
            c.RestricaoAcucar = dr.GetBoolean(dr.GetOrdinal("restricao_acucar"));
            c.Ativo = dr.GetBoolean(dr.GetOrdinal("ativo"));

            try
            {
                int ordBloq = dr.GetOrdinal("bloqueado_encomendas");
                c.BloqueadoEncomendas = !dr.IsDBNull(ordBloq) && dr.GetBoolean(ordBloq);
            }
            catch { c.BloqueadoEncomendas = false; }

            try
            {
                int ordMotivo = dr.GetOrdinal("motivo_bloqueio");
                c.MotivoBloqueio = dr.IsDBNull(ordMotivo) ? null : dr.GetString(ordMotivo);
            }
            catch { c.MotivoBloqueio = null; }

            return c;
        }
        
        public List<Cliente> Listar()
        {
            var lista = new List<Cliente>();
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = "SELECT * FROM cliente WHERE ativo = true ORDER BY nome";
            using var dr = cmd.ExecuteReader();
            while (dr.Read()) lista.Add(Map(dr));
            return lista;
        }

        public bool Alterar(Cliente cliente)
        {
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = @"UPDATE cliente SET nome = @nome, cpf = @cpf, email = @email, 
                        telefone = @telefone, restricao_gluten = @gluten, 
                        restricao_lactose = @lactose, restricao_acucar = @acucar 
                        WHERE id = @id";
            cmd.Parameters.AddWithValue("@nome", cliente.Nome);
            cmd.Parameters.AddWithValue("@cpf", (object?)cliente.Cpf ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@email", (object?)cliente.Email ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@telefone", (object?)cliente.Telefone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@gluten", cliente.RestricaoGluten);
            cmd.Parameters.AddWithValue("@lactose", cliente.RestricaoLactose);
            cmd.Parameters.AddWithValue("@acucar", cliente.RestricaoAcucar);
            cmd.Parameters.AddWithValue("@id", cliente.Id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool AlterarPerfil(Cliente cliente)
        {
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = @"UPDATE cliente SET nome = @nome, 
                        telefone = @telefone, restricao_gluten = @gluten, 
                        restricao_lactose = @lactose, restricao_acucar = @acucar 
                        WHERE id = @id";
            cmd.Parameters.AddWithValue("@nome", cliente.Nome);
            cmd.Parameters.AddWithValue("@telefone", (object?)cliente.Telefone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@gluten", cliente.RestricaoGluten);
            cmd.Parameters.AddWithValue("@lactose", cliente.RestricaoLactose);
            cmd.Parameters.AddWithValue("@acucar", cliente.RestricaoAcucar);
            cmd.Parameters.AddWithValue("@id", cliente.Id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public Cliente? ObterPorEmail(string email)
        {
            try
            {
                var conn = _context.GetConexao();
                if (conn.State != ConnectionState.Open) conn.Open();

                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT * FROM cliente WHERE LOWER(email) = LOWER(@email) AND ativo = true LIMIT 1";
                cmd.Parameters.AddWithValue("@email", email.Trim());

                using var dr = cmd.ExecuteReader();
                if (dr.Read())
                {
                    return Map(dr);
                }
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao obter cliente por e-mail: " + ex.Message);
                return null;
            }
        }

        public bool AtualizarSenha(int clienteId, string novaSenhaHash)
        {
            try
            {
                var conn = _context.GetConexao();
                if (conn.State != ConnectionState.Open) conn.Open();

                using var cmd = conn.CreateCommand();
                cmd.CommandText = "UPDATE cliente SET senha = @senha WHERE id = @id";
                cmd.Parameters.AddWithValue("@senha", novaSenhaHash);
                cmd.Parameters.AddWithValue("@id", clienteId);

                return cmd.ExecuteNonQuery() > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao atualizar senha do cliente: " + ex.Message);
                return false;
            }
        }

        public bool ExcluirSoftDelete(int clienteId)
        {
            try
            {
                var conn = _context.GetConexao();
                if (conn.State != ConnectionState.Open) conn.Open();

                using var cmd = conn.CreateCommand();
                // Marca como inativo (soft delete) garantindo integridade das encomendas passadas
                cmd.CommandText = "UPDATE cliente SET ativo = false WHERE id = @id";
                cmd.Parameters.AddWithValue("@id", clienteId);

                return cmd.ExecuteNonQuery() > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao efetuar soft delete do cliente: " + ex.Message);
                return false;
            }
        }

        public bool Excluir(int id)
        {
            using var cmdCheck = _context.GetConexao().CreateCommand();
            cmdCheck.CommandText = "SELECT COUNT(*) FROM encomenda WHERE cliente_id = @id";
            cmdCheck.Parameters.AddWithValue("@id", id);
            long encomendasVinculadas = (long)cmdCheck.ExecuteScalar();

            using var cmd = _context.GetConexao().CreateCommand();
            if (encomendasVinculadas > 0)
            {
                cmd.CommandText = "UPDATE cliente SET ativo = false WHERE id = @id";
            }
            else
            {
                cmd.CommandText = "DELETE FROM cliente WHERE id = @id";
            }
            
            cmd.Parameters.AddWithValue("@id", id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public Cliente? ObterPorId(int id)
        {
            try
            {
                var conn = _context.GetConexao();
                if (conn.State != ConnectionState.Open) conn.Open();

                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT * FROM cliente WHERE id = @id LIMIT 1";
                cmd.Parameters.AddWithValue("@id", id);

                using var dr = cmd.ExecuteReader();
                if (dr.Read())
                {
                    return Map(dr);
                }
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao obter cliente por id: " + ex.Message);
                return null;
            }
        }

        public Cliente? ObterPorCpf(string cpf)
        {
            try
            {
                var conn = _context.GetConexao();
                if (conn.State != ConnectionState.Open) conn.Open();

                string cpfLimpo = System.Text.RegularExpressions.Regex.Replace(cpf ?? "", @"\D", "");

                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"
                    SELECT * FROM cliente 
                    WHERE (cpf = @cpfOriginal 
                       OR (@cpfLimpo <> '' AND regexp_replace(COALESCE(cpf, ''), '\D', '', 'g') = @cpfLimpo))
                    LIMIT 1";
                cmd.Parameters.AddWithValue("@cpfOriginal", (object?)cpf ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@cpfLimpo", cpfLimpo);

                using var dr = cmd.ExecuteReader();
                if (dr.Read())
                {
                    return Map(dr);
                }
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao obter cliente por CPF: " + ex.Message);
                return null;
            }
        }

        public bool AtualizarBloqueio(int clienteId, bool bloqueado, string? motivo)
        {
            try
            {
                GarantirColunasInadimplencia();
                var conn = _context.GetConexao();
                if (conn.State != ConnectionState.Open) conn.Open();

                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"
                    UPDATE cliente 
                    SET bloqueado_encomendas = @bloqueado, 
                        motivo_bloqueio = @motivo 
                    WHERE id = @id";
                cmd.Parameters.AddWithValue("@bloqueado", bloqueado);
                cmd.Parameters.AddWithValue("@motivo", (object?)motivo ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@id", clienteId);

                return cmd.ExecuteNonQuery() > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao atualizar status de bloqueio do cliente: " + ex.Message);
                return false;
            }
        }

        public List<ClienteInadimplenciaItemDTO> ListarInadimplentes(string? busca, bool apenasBloqueados)
        {
            GarantirColunasInadimplencia();
            var lista = new List<ClienteInadimplenciaItemDTO>();
            try
            {
                var conn = _context.GetConexao();
                if (conn.State != ConnectionState.Open) conn.Open();

                using var cmd = conn.CreateCommand();
                
                string whereFiltro = "WHERE c.ativo = true ";
                if (apenasBloqueados)
                {
                    whereFiltro += "AND c.bloqueado_encomendas = true ";
                }
                if (!string.IsNullOrWhiteSpace(busca))
                {
                    whereFiltro += "AND (LOWER(c.nome) LIKE @busca OR c.cpf LIKE @busca OR regexp_replace(COALESCE(c.cpf, ''), '\\D', '', 'g') LIKE @buscaLimpa) ";
                    string buscaTexto = $"%{busca.Trim().ToLower()}%";
                    string buscaLimpa = $"%{System.Text.RegularExpressions.Regex.Replace(busca, @"\D", "")}%";
                    cmd.Parameters.AddWithValue("@busca", buscaTexto);
                    cmd.Parameters.AddWithValue("@buscaLimpa", buscaLimpa);
                }

                cmd.CommandText = $@"
                    SELECT 
                        c.id,
                        c.nome,
                        c.cpf,
                        c.telefone,
                        c.email,
                        c.bloqueado_encomendas,
                        c.motivo_bloqueio,
                        COUNT(CASE WHEN (p.status IS NULL OR p.status != 'pago') AND COALESCE(p.saldo_devedor, e.valor_total) > 0 AND e.status_enum != 3 THEN 1 END) AS qtd_pendentes,
                        COUNT(CASE WHEN (p.status IS NULL OR p.status != 'pago') AND COALESCE(p.saldo_devedor, e.valor_total) > 0 AND e.status_enum != 3 AND e.data_retirada < (NOW() AT TIME ZONE 'UTC') THEN 1 END) AS qtd_atraso,
                        COALESCE(SUM(CASE WHEN (p.status IS NULL OR p.status != 'pago') AND e.status_enum != 3 THEN COALESCE(p.saldo_devedor, e.valor_total) ELSE 0 END), 0) AS valor_total_devido
                    FROM cliente c
                    LEFT JOIN encomenda e ON e.cliente_id = c.id AND e.status_enum != 3
                    LEFT JOIN pagamento p ON p.encomenda_id = e.id
                    {whereFiltro}
                    GROUP BY c.id, c.nome, c.cpf, c.telefone, c.email, c.bloqueado_encomendas, c.motivo_bloqueio
                    HAVING (c.bloqueado_encomendas = true OR COUNT(CASE WHEN (p.status IS NULL OR p.status != 'pago') AND COALESCE(p.saldo_devedor, e.valor_total) > 0 AND e.status_enum != 3 THEN 1 END) > 0)
                    ORDER BY c.bloqueado_encomendas DESC, qtd_atraso DESC, valor_total_devido DESC, c.nome ASC";

                using var dr = cmd.ExecuteReader();
                while (dr.Read())
                {
                    lista.Add(new ClienteInadimplenciaItemDTO
                    {
                        Id = dr.GetInt32(dr.GetOrdinal("id")),
                        Nome = dr.GetString(dr.GetOrdinal("nome")),
                        Cpf = dr.IsDBNull(dr.GetOrdinal("cpf")) ? null : dr.GetString(dr.GetOrdinal("cpf")),
                        Telefone = dr.IsDBNull(dr.GetOrdinal("telefone")) ? null : dr.GetString(dr.GetOrdinal("telefone")),
                        Email = dr.IsDBNull(dr.GetOrdinal("email")) ? null : dr.GetString(dr.GetOrdinal("email")),
                        BloqueadoEncomendas = dr.GetBoolean(dr.GetOrdinal("bloqueado_encomendas")),
                        MotivoBloqueio = dr.IsDBNull(dr.GetOrdinal("motivo_bloqueio")) ? null : dr.GetString(dr.GetOrdinal("motivo_bloqueio")),
                        QtdEncomendasPendentes = Convert.ToInt32(dr["qtd_pendentes"]),
                        QtdEncomendasAtraso = Convert.ToInt32(dr["qtd_atraso"]),
                        ValorTotalDevido = Convert.ToDecimal(dr["valor_total_devido"])
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao listar clientes inadimplentes: " + ex.Message);
            }
            return lista;
        }

        public VerificarCpfResponseDTO ObterSituacaoFinanceiraCliente(int? clienteId, string? cpf)
        {
            GarantirColunasInadimplencia();
            var conn = _context.GetConexao();
            if (conn.State != ConnectionState.Open) conn.Open();

            string cpfLimpo = System.Text.RegularExpressions.Regex.Replace(cpf ?? "", @"\D", "");

            using var cmd = conn.CreateCommand();

            string whereClause;
            if (clienteId.HasValue)
            {
                whereClause = "WHERE c.id = @clienteId";
                cmd.Parameters.AddWithValue("@clienteId", clienteId.Value);
            }
            else
            {
                whereClause = "WHERE (c.cpf = @cpfOriginal OR (@cpfLimpo <> '' AND regexp_replace(COALESCE(c.cpf, ''), '\\D', '', 'g') = @cpfLimpo))";
                cmd.Parameters.AddWithValue("@cpfOriginal", !string.IsNullOrWhiteSpace(cpf) ? (object)cpf.Trim() : DBNull.Value);
                cmd.Parameters.AddWithValue("@cpfLimpo", cpfLimpo);
            }

            cmd.CommandText = $@"
                SELECT 
                    c.id,
                    c.nome,
                    c.cpf,
                    c.bloqueado_encomendas,
                    c.motivo_bloqueio,
                    COUNT(CASE WHEN (p.status IS NULL OR p.status != 'pago') AND COALESCE(p.saldo_devedor, e.valor_total) > 0 AND e.status_enum != 3 THEN 1 END) AS qtd_pendentes,
                    COUNT(CASE WHEN (p.status IS NULL OR p.status != 'pago') AND COALESCE(p.saldo_devedor, e.valor_total) > 0 AND e.status_enum != 3 AND e.data_retirada < (NOW() AT TIME ZONE 'UTC') THEN 1 END) AS qtd_atraso,
                    COALESCE(SUM(CASE WHEN (p.status IS NULL OR p.status != 'pago') AND e.status_enum != 3 THEN COALESCE(p.saldo_devedor, e.valor_total) ELSE 0 END), 0) AS valor_total_devido
                FROM cliente c
                LEFT JOIN encomenda e ON e.cliente_id = c.id AND e.status_enum != 3
                LEFT JOIN pagamento p ON p.encomenda_id = e.id
                {whereClause}
                GROUP BY c.id, c.nome, c.cpf, c.bloqueado_encomendas, c.motivo_bloqueio
                LIMIT 1";

            using var dr = cmd.ExecuteReader();
            if (dr.Read())
            {
                int id = dr.GetInt32(dr.GetOrdinal("id"));
                string nome = dr.GetString(dr.GetOrdinal("nome"));
                string cpfEncontrado = dr.IsDBNull(dr.GetOrdinal("cpf")) ? (cpf ?? "") : dr.GetString(dr.GetOrdinal("cpf"));
                bool bloqueado = dr.GetBoolean(dr.GetOrdinal("bloqueado_encomendas"));
                string? motivo = dr.IsDBNull(dr.GetOrdinal("motivo_bloqueio")) ? null : dr.GetString(dr.GetOrdinal("motivo_bloqueio"));
                int qtdPendentes = Convert.ToInt32(dr["qtd_pendentes"]);
                int qtdAtraso = Convert.ToInt32(dr["qtd_atraso"]);
                decimal valorDevido = Convert.ToDecimal(dr["valor_total_devido"]);

                bool podeRealizar = !bloqueado && qtdPendentes < 2;
                bool alertaPendencia = qtdPendentes == 1;

                string mensagem;
                if (bloqueado)
                {
                    mensagem = string.IsNullOrWhiteSpace(motivo) 
                        ? "Cliente temporariamente impossibilitado de realizar encomendas online. Favor contactar o balcão da panificadora."
                        : $"Cliente bloqueado para novas encomendas. Motivo: {motivo}";
                }
                else if (qtdPendentes >= 2)
                {
                    mensagem = $"Cliente possui {qtdPendentes} encomendas com pagamento pendente no balcão. Bloqueado automaticamente para novos pedidos até regularização.";
                }
                else if (alertaPendencia)
                {
                    mensagem = "Atenção: Identificamos uma encomenda anterior pendente de confirmação no balcão.";
                }
                else
                {
                    mensagem = "Cliente apto e sem restrições para realizar encomendas.";
                }

                return new VerificarCpfResponseDTO
                {
                    ClienteId = id,
                    Nome = nome,
                    Cpf = cpfEncontrado,
                    BloqueadoEncomendas = bloqueado,
                    MotivoBloqueio = motivo,
                    QtdEncomendasPendentes = qtdPendentes,
                    QtdEncomendasAtraso = qtdAtraso,
                    ValorTotalDevido = valorDevido,
                    PodeRealizarEncomenda = podeRealizar,
                    AlertaPendenciaAnterior = alertaPendencia,
                    Mensagem = mensagem
                };
            }

            return new VerificarCpfResponseDTO
            {
                ClienteId = null,
                Nome = null,
                Cpf = cpf ?? "",
                BloqueadoEncomendas = false,
                MotivoBloqueio = null,
                QtdEncomendasPendentes = 0,
                QtdEncomendasAtraso = 0,
                ValorTotalDevido = 0,
                PodeRealizarEncomenda = true,
                AlertaPendenciaAnterior = false,
                Mensagem = "Cliente não cadastrado ou sem pendências financeiras registradas."
            };
        }
    }
}