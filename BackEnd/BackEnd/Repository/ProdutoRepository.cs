using BackEnd.Models;
using Npgsql;
using System.Data;

namespace BackEnd.Repository
{
    public class ProdutoRepository
    {
        private readonly PostgresDbContext _context;

        public ProdutoRepository(PostgresDbContext context)
        {
            _context = context;
        }

        // Dentro do método Map
        public Produto Map(NpgsqlDataReader dr)
        {
            return new Produto
            {
                Id = dr.GetInt32(dr.GetOrdinal("id")),
                Nome = dr.GetString(dr.GetOrdinal("nome")),
                PrecoUnitario = dr.GetDecimal(dr.GetOrdinal("preco_unitario")),
                CategoriaId = dr.GetInt32(dr.GetOrdinal("categoria_id")),
                // Adicione esta linha para ler a URL do banco
                ImagemUrl = dr.IsDBNull(dr.GetOrdinal("imagem_url")) ? null : dr.GetString(dr.GetOrdinal("imagem_url"))
            };
        }


        public bool Criar(Produto produto)
        {
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = @"INSERT INTO produto (nome, preco_unitario, categoria_id, imagem_url) 
                        VALUES (@nome, @preco, @categoriaId, @img) 
                        RETURNING id";

            cmd.Parameters.AddWithValue("@nome", produto.Nome);
            cmd.Parameters.AddWithValue("@preco", produto.PrecoUnitario);
            cmd.Parameters.AddWithValue("@categoriaId", produto.CategoriaId);
            cmd.Parameters.AddWithValue("@img", (object?)produto.ImagemUrl ?? DBNull.Value);

            produto.Id = (int)cmd.ExecuteScalar();
            return true;
        }
        
        public List<Produto> Listar()
        {
            var lista = new List<Produto>();
            using var cmd = _context.GetConexao().CreateCommand();
            // Fazemos um JOIN simples para trazer o nome da categoria se quiser
            cmd.CommandText = "SELECT * FROM produto ORDER BY nome";
            using var dr = cmd.ExecuteReader();
            while (dr.Read()) lista.Add(Map(dr));
            return lista;
        }

        public bool Alterar(Produto produto)
        {
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = @"UPDATE produto SET nome = @nome, preco_unitario = @preco, 
                        categoria_id = @catId WHERE id = @id";
            cmd.Parameters.AddWithValue("@nome", produto.Nome);
            cmd.Parameters.AddWithValue("@preco", produto.PrecoUnitario);
            cmd.Parameters.AddWithValue("@catId", produto.CategoriaId);
            cmd.Parameters.AddWithValue("@id", produto.Id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool Excluir(int id)
        {
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = "DELETE FROM produto WHERE id = @id"; // Aqui pode ser delete físico se não tiver venda vinculada
            cmd.Parameters.AddWithValue("@id", id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public Produto? ObterPorId(int id)
        {
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = "SELECT * FROM produto WHERE id = @id";
            cmd.Parameters.AddWithValue("@id", id);
            using var dr = cmd.ExecuteReader();
            if (dr.Read())
            {
                return Map(dr);
            }
            return null;
        }
    }
}