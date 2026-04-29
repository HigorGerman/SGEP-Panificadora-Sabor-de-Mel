using System.Data;
using Npgsql;

namespace BackEnd.Repository
{
    public class PostgresDbContext : IDisposable
    {
        private readonly NpgsqlConnection _conexao;

        public PostgresDbContext(IConfiguration configuration)
        {
            // Busca a string que acabamos de colocar no appsettings.json
            string stringConexao = configuration.GetConnectionString("DefaultConnection") 
                                   ?? throw new Exception("String de conexão não encontrada!");

            _conexao = new NpgsqlConnection(stringConexao);
        }

        // Método que o Repository vai chamar para pegar a conexão aberta
        public NpgsqlConnection GetConexao()
        {
            if (_conexao.State == ConnectionState.Closed)
                _conexao.Open();

            return _conexao;
        }

        // Garante que o C# feche a conexão quando terminar de usar
        public void Dispose()
        {
            if (_conexao.State == ConnectionState.Open)
                _conexao.Close();

            _conexao.Dispose();
        }
    }
}