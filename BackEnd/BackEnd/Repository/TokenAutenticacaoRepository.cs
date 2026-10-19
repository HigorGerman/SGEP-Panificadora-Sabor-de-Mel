using System;
using System.Data;
using BackEnd.Models;
using Npgsql;

namespace BackEnd.Repository
{
    public class TokenAutenticacaoRepository
    {
        private readonly PostgresDbContext _context;

        public TokenAutenticacaoRepository(PostgresDbContext context)
        {
            _context = context;
            GarantirTabelaExiste();
        }

        private void GarantirTabelaExiste()
        {
            try
            {
                var conn = _context.GetConexao();
                if (conn.State != ConnectionState.Open) conn.Open();

                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS token_autenticacao (
                        id SERIAL PRIMARY KEY,
                        cliente_id INTEGER NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
                        codigo_token VARCHAR(6) NOT NULL,
                        tipo_token VARCHAR(50) NOT NULL,
                        data_expiracao TIMESTAMP NOT NULL,
                        utilizado BOOLEAN NOT NULL DEFAULT FALSE,
                        data_criacao TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
                    );";
                cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                Console.WriteLine("⚠️ Erro ao verificar/criar tabela token_autenticacao: " + ex.Message);
            }
        }

        public bool InvalidarTokensAnteriores(int clienteId, string tipoToken)
        {
            try
            {
                var conn = _context.GetConexao();
                if (conn.State != ConnectionState.Open) conn.Open();

                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"UPDATE token_autenticacao 
                                    SET utilizado = true 
                                    WHERE cliente_id = @clienteId AND tipo_token = @tipoToken AND utilizado = false";
                cmd.Parameters.AddWithValue("@clienteId", clienteId);
                cmd.Parameters.AddWithValue("@tipoToken", tipoToken);

                cmd.ExecuteNonQuery();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao invalidar tokens anteriores: " + ex.Message);
                return false;
            }
        }

        public bool Criar(TokenAutenticacao token)
        {
            try
            {
                var conn = _context.GetConexao();
                if (conn.State != ConnectionState.Open) conn.Open();

                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"INSERT INTO token_autenticacao 
                                    (cliente_id, codigo_token, tipo_token, data_expiracao, utilizado, data_criacao)
                                    VALUES (@clienteId, @codigoToken, @tipoToken, @dataExpiracao, false, NOW() AT TIME ZONE 'UTC')
                                    RETURNING id";

                cmd.Parameters.AddWithValue("@clienteId", token.ClienteId);
                cmd.Parameters.AddWithValue("@codigoToken", token.CodigoToken);
                cmd.Parameters.AddWithValue("@tipoToken", token.TipoToken);
                cmd.Parameters.AddWithValue("@dataExpiracao", token.DataExpiracao);

                var result = cmd.ExecuteScalar();
                if (result != null)
                {
                    token.Id = Convert.ToInt32(result);
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao gravar token_autenticacao: " + ex.Message);
                return false;
            }
        }

        public TokenAutenticacao? ObterTokenValido(int clienteId, string codigoToken, string tipoToken)
        {
            try
            {
                var conn = _context.GetConexao();
                if (conn.State != ConnectionState.Open) conn.Open();

                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"SELECT * FROM token_autenticacao 
                                    WHERE cliente_id = @clienteId 
                                      AND codigo_token = @codigoToken 
                                      AND tipo_token = @tipoToken 
                                      AND utilizado = false 
                                      AND data_expiracao >= NOW() AT TIME ZONE 'UTC'
                                    ORDER BY id DESC LIMIT 1";

                cmd.Parameters.AddWithValue("@clienteId", clienteId);
                cmd.Parameters.AddWithValue("@codigoToken", codigoToken.Trim());
                cmd.Parameters.AddWithValue("@tipoToken", tipoToken);

                using var dr = cmd.ExecuteReader();
                if (dr.Read())
                {
                    return new TokenAutenticacao
                    {
                        Id = dr.GetInt32(dr.GetOrdinal("id")),
                        ClienteId = dr.GetInt32(dr.GetOrdinal("cliente_id")),
                        CodigoToken = dr.GetString(dr.GetOrdinal("codigo_token")),
                        TipoToken = dr.GetString(dr.GetOrdinal("tipo_token")),
                        DataExpiracao = dr.GetDateTime(dr.GetOrdinal("data_expiracao")),
                        Utilizado = dr.GetBoolean(dr.GetOrdinal("utilizado"))
                    };
                }
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao consultar token_autenticacao: " + ex.Message);
                return null;
            }
        }

        public bool MarcarComoUtilizado(int tokenId)
        {
            try
            {
                var conn = _context.GetConexao();
                if (conn.State != ConnectionState.Open) conn.Open();

                using var cmd = conn.CreateCommand();
                cmd.CommandText = "UPDATE token_autenticacao SET utilizado = true WHERE id = @id";
                cmd.Parameters.AddWithValue("@id", tokenId);

                return cmd.ExecuteNonQuery() > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao marcar token como utilizado: " + ex.Message);
                return false;
            }
        }
    }
}
