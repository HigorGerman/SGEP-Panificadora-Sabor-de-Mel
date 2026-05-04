using BackEnd.Models;
using Npgsql;
using System.Data;

namespace BackEnd.Repository
{
    public class CategoriaRepository
    {
        private readonly PostgresDbContext _context;

        public CategoriaRepository(PostgresDbContext context)
        {
            _context = context;
        }

        public Categoria Map(NpgsqlDataReader dr)
        {
            return new Categoria
            {
                Id = dr.GetInt32(dr.GetOrdinal("id")),
                Descricao = dr.GetString(dr.GetOrdinal("descricao")),
                Inativo = dr.GetBoolean(dr.GetOrdinal("inativo"))
            };
        }

        public bool Criar(Categoria categoria)
        {
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = "INSERT INTO categoria (descricao, inativo) VALUES (@descricao, @inativo) RETURNING id";
            cmd.Parameters.AddWithValue("@descricao", categoria.Descricao);
            cmd.Parameters.AddWithValue("@inativo", categoria.Inativo);
            categoria.Id = (int)cmd.ExecuteScalar();
            return true;
        }

        public List<Categoria> Listar()
        {
            var lista = new List<Categoria>();
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = "SELECT * FROM categoria ORDER BY descricao";
            using var dr = cmd.ExecuteReader();
            while (dr.Read()) lista.Add(Map(dr));
            return lista;
        }

        public bool Alterar(Categoria categoria)
        {
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = "UPDATE categoria SET descricao = @descricao, inativo = @inativo WHERE id = @id";
            cmd.Parameters.AddWithValue("@descricao", categoria.Descricao);
            cmd.Parameters.AddWithValue("@inativo", categoria.Inativo);
            cmd.Parameters.AddWithValue("@id", categoria.Id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public string Excluir(int id)
        {
            using var cmd = _context.GetConexao().CreateCommand();
            
            cmd.CommandText = "SELECT COUNT(1) FROM produto WHERE categoria_id = @id";
            cmd.Parameters.AddWithValue("@id", id);
            var count = Convert.ToInt32(cmd.ExecuteScalar());

            if (count > 0)
            {
                using var updateCmd = _context.GetConexao().CreateCommand();
                updateCmd.CommandText = "UPDATE categoria SET inativo = true WHERE id = @id";
                updateCmd.Parameters.AddWithValue("@id", id);
                updateCmd.ExecuteNonQuery();
                return "Categoria com produtos vinculados foi desativada para manter a integridade";
            }
            else
            {
                using var deleteCmd = _context.GetConexao().CreateCommand();
                deleteCmd.CommandText = "DELETE FROM categoria WHERE id = @id";
                deleteCmd.Parameters.AddWithValue("@id", id);
                deleteCmd.ExecuteNonQuery();
                return "Categoria excluída com sucesso";
            }
        }
    }
}
