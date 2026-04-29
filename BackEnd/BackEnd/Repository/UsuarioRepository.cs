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
                cmd.Parameters.AddWithValue("@senha", usuario.Senha);
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
                // Atenção aos nomes das colunas: 'email', 'senha' e 'excluido'
                cmd.CommandText = "SELECT * FROM usuario WHERE email = @email AND senha = @senha AND excluido = false LIMIT 1";
        
                cmd.Parameters.AddWithValue("@email", email);
                cmd.Parameters.AddWithValue("@senha", senha);

                using var dr = cmd.ExecuteReader();
        
                if (dr.Read())
                {
                    return Map(dr); // Usa o seu método Map que já está pronto
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
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = "UPDATE usuario SET excluido = true WHERE id = @id";
            cmd.Parameters.AddWithValue("@id", id);
            return cmd.ExecuteNonQuery() > 0;
        }
    }
}