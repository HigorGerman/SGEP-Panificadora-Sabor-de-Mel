using BackEnd.Models;
using Npgsql;
using System.Data;

namespace BackEnd.Repository
{
    public class ReceitaRepository
    {
        private readonly PostgresDbContext _context;

        public ReceitaRepository(PostgresDbContext context)
        {
            _context = context;
        }

        public Receita Map(NpgsqlDataReader dr)
        {
            return new Receita
            {
                Id = dr.GetInt32(dr.GetOrdinal("id")),
                ProdutoId = dr.GetInt32(dr.GetOrdinal("produto_id")),
                Ingredientes = dr.IsDBNull(dr.GetOrdinal("ingredientes")) ? null : dr.GetString(dr.GetOrdinal("ingredientes")),
                ModoPreparo = dr.IsDBNull(dr.GetOrdinal("modo_preparo")) ? null : dr.GetString(dr.GetOrdinal("modo_preparo")),
                Rendimento = dr.IsDBNull(dr.GetOrdinal("rendimento")) ? null : dr.GetString(dr.GetOrdinal("rendimento"))
            };
        }

        public Receita? ObterPorProduto(int produtoId)
        {
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = "SELECT * FROM receita WHERE produto_id = @produtoId";
            cmd.Parameters.AddWithValue("@produtoId", produtoId);
            using var dr = cmd.ExecuteReader();
            if (dr.Read())
            {
                return Map(dr);
            }
            return null;
        }

        public bool Salvar(Receita receita)
        {
            var existente = ObterPorProduto(receita.ProdutoId);

            using var cmd = _context.GetConexao().CreateCommand();

            if (existente == null)
            {
                cmd.CommandText = @"INSERT INTO receita (produto_id, ingredientes, modo_preparo, rendimento) 
                                    VALUES (@produtoId, @ingredientes, @modoPreparo, @rendimento) RETURNING id";
            }
            else
            {
                cmd.CommandText = @"UPDATE receita SET ingredientes = @ingredientes, modo_preparo = @modoPreparo, 
                                    rendimento = @rendimento WHERE produto_id = @produtoId RETURNING id";
            }

            cmd.Parameters.AddWithValue("@produtoId", receita.ProdutoId);
            cmd.Parameters.AddWithValue("@ingredientes", (object?)receita.Ingredientes ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@modoPreparo", (object?)receita.ModoPreparo ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@rendimento", (object?)receita.Rendimento ?? DBNull.Value);

            var idResult = cmd.ExecuteScalar();
            if (idResult != null)
            {
                receita.Id = (int)idResult;
                return true;
            }
            return false;
        }
    }
}
