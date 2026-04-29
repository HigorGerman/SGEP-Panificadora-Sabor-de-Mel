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
                cmd.Parameters.AddWithValue("@senha", (object?)cliente.Senha ?? DBNull.Value);
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
                // Buscamos o cliente pelo email e senha, garantindo que ele esteja ativo
                cmd.CommandText = "SELECT * FROM cliente WHERE email = @email AND senha = @senha AND ativo = true LIMIT 1";
        
                cmd.Parameters.AddWithValue("@email", email);
                cmd.Parameters.AddWithValue("@senha", senha);

                using var dr = cmd.ExecuteReader();
        
                if (dr.Read())
                {
                    return Map(dr); // Usa o seu método Map que já está pronto!
                }
        
                return null; // Não achou ninguém
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

        public bool Excluir(int id)
        {
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = "UPDATE cliente SET ativo = false WHERE id = @id";
            cmd.Parameters.AddWithValue("@id", id);
            return cmd.ExecuteNonQuery() > 0;
        }
    }
}