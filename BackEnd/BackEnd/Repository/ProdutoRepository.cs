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
                ImagemUrl = dr.IsDBNull(dr.GetOrdinal("imagem_url")) ? null : dr.GetString(dr.GetOrdinal("imagem_url")),
                Descricao = dr.IsDBNull(dr.GetOrdinal("descricao")) ? null : dr.GetString(dr.GetOrdinal("descricao")),
                PermiteCustomizacao = dr.GetBoolean(dr.GetOrdinal("permite_customizacao")),
                TemplateCustomizacao = dr.IsDBNull(dr.GetOrdinal("template_customizacao")) ? null : dr.GetString(dr.GetOrdinal("template_customizacao")),
                ContemGluten = dr.GetBoolean(dr.GetOrdinal("contem_gluten")),
                ContemLactose = dr.GetBoolean(dr.GetOrdinal("contem_lactose")),
                ContemAcucar = dr.GetBoolean(dr.GetOrdinal("contem_acucar"))
            };
        }


        public bool Criar(Produto produto)
        {
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = @"INSERT INTO produto (nome, preco_unitario, categoria_id, imagem_url, descricao, permite_customizacao, template_customizacao, contem_gluten, contem_lactose, contem_acucar) 
                        VALUES (@nome, @preco, @categoriaId, @img, @descricao, @permiteCustomizacao, CAST(@templateCustomizacao AS jsonb), @gluten, @lactose, @acucar) 
                        RETURNING id";

            cmd.Parameters.AddWithValue("@nome", produto.Nome);
            cmd.Parameters.AddWithValue("@preco", produto.PrecoUnitario);
            cmd.Parameters.AddWithValue("@categoriaId", produto.CategoriaId);
            cmd.Parameters.AddWithValue("@img", (object?)produto.ImagemUrl ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@descricao", (object?)produto.Descricao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@permiteCustomizacao", produto.PermiteCustomizacao);
            cmd.Parameters.AddWithValue("@templateCustomizacao", string.IsNullOrEmpty(produto.TemplateCustomizacao) ? DBNull.Value : (object)produto.TemplateCustomizacao);
            cmd.Parameters.AddWithValue("@gluten", produto.ContemGluten);
            cmd.Parameters.AddWithValue("@lactose", produto.ContemLactose);
            cmd.Parameters.AddWithValue("@acucar", produto.ContemAcucar);

            produto.Id = (int)cmd.ExecuteScalar();
            return true;
        }
        
        public List<Produto> Listar()
        {
            var lista = new List<Produto>();
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = "SELECT * FROM produto ORDER BY nome";
            using var dr = cmd.ExecuteReader();
            while (dr.Read()) lista.Add(Map(dr));
            return lista;
        }

        public List<Produto> ListarComReceitas()
        {
            var lista = new List<Produto>();
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = @"
                SELECT p.*, r.ingredientes, r.modo_preparo, r.rendimento 
                FROM produto p
                INNER JOIN receita r ON p.id = r.produto_id
                ORDER BY p.nome";
            
            using var dr = cmd.ExecuteReader();
            while (dr.Read()) 
            {
                var p = Map(dr);
                p.Receita = new Receita {
                    Ingredientes = dr.IsDBNull(dr.GetOrdinal("ingredientes")) ? null : dr.GetString(dr.GetOrdinal("ingredientes")),
                    ModoPreparo = dr.IsDBNull(dr.GetOrdinal("modo_preparo")) ? null : dr.GetString(dr.GetOrdinal("modo_preparo")),
                    Rendimento = dr.IsDBNull(dr.GetOrdinal("rendimento")) ? null : dr.GetString(dr.GetOrdinal("rendimento"))
                };
                lista.Add(p);
            }
            return lista;
        }

        public bool Alterar(Produto produto)
        {
            using var cmd = _context.GetConexao().CreateCommand();
            cmd.CommandText = @"UPDATE produto SET nome = @nome, preco_unitario = @preco, 
                        categoria_id = @catId, descricao = @descricao, permite_customizacao = @permiteCustomizacao, template_customizacao = CAST(@templateCustomizacao AS jsonb), contem_gluten = @gluten, contem_lactose = @lactose, contem_acucar = @acucar WHERE id = @id";
            cmd.Parameters.AddWithValue("@nome", produto.Nome);
            cmd.Parameters.AddWithValue("@preco", produto.PrecoUnitario);
            cmd.Parameters.AddWithValue("@catId", produto.CategoriaId);
            cmd.Parameters.AddWithValue("@descricao", (object?)produto.Descricao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@permiteCustomizacao", produto.PermiteCustomizacao);
            cmd.Parameters.AddWithValue("@templateCustomizacao", string.IsNullOrEmpty(produto.TemplateCustomizacao) ? DBNull.Value : (object)produto.TemplateCustomizacao);
            cmd.Parameters.AddWithValue("@gluten", produto.ContemGluten);
            cmd.Parameters.AddWithValue("@lactose", produto.ContemLactose);
            cmd.Parameters.AddWithValue("@acucar", produto.ContemAcucar);
            cmd.Parameters.AddWithValue("@id", produto.Id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool Excluir(int id)
        {
            try {
                using var cmdReceita = _context.GetConexao().CreateCommand();
                cmdReceita.CommandText = "DELETE FROM receita WHERE produto_id = @id";
                cmdReceita.Parameters.AddWithValue("@id", id);
                cmdReceita.ExecuteNonQuery();

                using var cmd = _context.GetConexao().CreateCommand();
                cmd.CommandText = "DELETE FROM produto WHERE id = @id";
                cmd.Parameters.AddWithValue("@id", id);
                return cmd.ExecuteNonQuery() > 0;
            } catch (PostgresException ex) when (ex.SqlState == "23503") {
                throw new Exception("Não é possível excluir o produto pois ele já está vinculado a encomendas no sistema.");
            }
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