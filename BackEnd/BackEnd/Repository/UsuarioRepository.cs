using BackEnd.Models;
using Npgsql;
using System.Data;

namespace BackEnd.Repository
{
    public class UsuarioRepository
    {
        private readonly PostgresDbContext _context;

        public UsuarioRepository(PostgresDbContext context)
        {
            _context = context;
        }

        public bool Criar(Usuario usuario)
        {
            try
            {
                using var cmd = _context.GetConexao().CreateCommand();
                cmd.CommandText = @"INSERT INTO usuario (usuario_nome, email, senha, perfil_enum, excluido) 
                                    VALUES (@nome, @email, @senha, @perfil, false) 
                                    RETURNING id";

                cmd.Parameters.AddWithValue("@nome", usuario.UsuarioNome);
                cmd.Parameters.AddWithValue("@email", usuario.Email);
                cmd.Parameters.AddWithValue("@senha", BCrypt.Net.BCrypt.HashPassword(usuario.Senha));
                cmd.Parameters.AddWithValue("@perfil", (int)usuario.Perfil);

                // Executa e pega o ID gerado pelo Postgres
                usuario.Id = (int)cmd.ExecuteScalar();
                return true;
            }
            catch (Exception)
            {
                throw;
            }
        }
        
        public Usuario? ObterPorEmailESenha(string email, string senha)
        {
            try
            {
                using var cmd = _context.GetConexao().CreateCommand();
                cmd.CommandText = "SELECT * FROM usuario WHERE email = @email AND excluido = false LIMIT 1";
                cmd.Parameters.AddWithValue("@email", email);

                using var dr = cmd.ExecuteReader();
                if (dr.Read())
                {
                    var usuario = Map(dr);
                    string hashNoBanco = usuario.Senha;
                    
                    bool isBcrypt = hashNoBanco.StartsWith("$2a$") || hashNoBanco.StartsWith("$2b$") || hashNoBanco.StartsWith("$2y$");
                    
                    if (isBcrypt) 
                    {
                        if (BCrypt.Net.BCrypt.Verify(senha, hashNoBanco))
                        {
                            return usuario;
                        }
                    }
                    else
                    {
                        // Tratamento de Dados Legados
                        if (hashNoBanco == senha)
                        {
                            dr.Close(); // Close the reader before doing an UPDATE
                            
                            // Upgrade automático da senha para BCrypt
                            using var cmdUpdate = _context.GetConexao().CreateCommand();
                            cmdUpdate.CommandText = "UPDATE usuario SET senha = @novaSenha WHERE id = @id";
                            string newHash = BCrypt.Net.BCrypt.HashPassword(senha);
                            cmdUpdate.Parameters.AddWithValue("@novaSenha", newHash);
                            cmdUpdate.Parameters.AddWithValue("@id", usuario.Id);
                            cmdUpdate.ExecuteNonQuery();

                            usuario.Senha = newHash;
                            return usuario;
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

        public Usuario Map(NpgsqlDataReader dr)
        {
            var usuario = new Usuario();
            usuario.Id = dr.GetInt32(dr.GetOrdinal("id"));
            usuario.UsuarioNome = dr.GetString(dr.GetOrdinal("usuario_nome"));
            usuario.Email = dr.GetString(dr.GetOrdinal("email"));
            usuario.Senha = dr.GetString(dr.GetOrdinal("senha"));
            usuario.Perfil = (Usuario.PerfilEnum)dr.GetInt32(dr.GetOrdinal("perfil_enum"));
            usuario.Excluido = dr.GetBoolean(dr.GetOrdinal("excluido"));
            return usuario;
        }
        
        public List<Usuario> Listar()
        {
            var lista = new List<Usuario>();
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = "SELECT * FROM usuario WHERE excluido = false ORDER BY id";
            using var dr = cmd.ExecuteReader();
            while (dr.Read()) lista.Add(Map(dr));
            return lista;
        }

        public bool Alterar(Usuario usuario)
        {
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = @"UPDATE usuario SET usuario_nome = @nome, email = @email, 
                        perfil_enum = @perfil WHERE id = @id";
            cmd.Parameters.AddWithValue("@nome", usuario.UsuarioNome);
            cmd.Parameters.AddWithValue("@email", usuario.Email);
            cmd.Parameters.AddWithValue("@perfil", (int)usuario.Perfil);
            cmd.Parameters.AddWithValue("@id", usuario.Id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool Excluir(int id)
        {
            using var cmdCheck = _context.GetConexao().CreateCommand();
            cmdCheck.CommandText = "SELECT COUNT(*) FROM encomenda WHERE usuario_id = @id";
            cmdCheck.Parameters.AddWithValue("@id", id);
            long encomendasVinculadas = (long)cmdCheck.ExecuteScalar();

            using var cmd = _context.GetConexao().CreateCommand();
            if (encomendasVinculadas > 0)
            {
                cmd.CommandText = "UPDATE usuario SET excluido = true WHERE id = @id";
            }
            else
            {
                cmd.CommandText = "DELETE FROM usuario WHERE id = @id";
            }
            
            cmd.Parameters.AddWithValue("@id", id);
            return cmd.ExecuteNonQuery() > 0;
        }
    }
}