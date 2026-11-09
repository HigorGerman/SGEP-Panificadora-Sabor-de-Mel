using System.Data;
using Npgsql;

namespace BackEnd.Repository
{
    public class PostgresDbContext : IDisposable
    {
        private readonly NpgsqlConnection _conexao;

        public PostgresDbContext(IConfiguration configuration)
        {
            string? databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
            string? stringConexao = !string.IsNullOrWhiteSpace(databaseUrl)
                ? ConverterDatabaseUrlParaConnectionString(databaseUrl)
                : configuration.GetConnectionString("DefaultConnection");

            if (string.IsNullOrWhiteSpace(stringConexao))
                throw new Exception("String de conexão não encontrada! Configure ConnectionStrings__DefaultConnection ou DATABASE_URL.");

            _conexao = new NpgsqlConnection(stringConexao);
        }

        private static string ConverterDatabaseUrlParaConnectionString(string databaseUrl)
        {
            // Se já estiver no formato padrão Npgsql (Host=...;Database=...), retorna direto
            if (!databaseUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
                !databaseUrl.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            {
                return databaseUrl;
            }

            var uri = new Uri(databaseUrl);
            var userInfo = uri.UserInfo.Split(':', 2);
            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = uri.Host,
                Port = uri.Port > 0 ? uri.Port : 5432,
                Database = uri.AbsolutePath.TrimStart('/'),
                Username = Uri.UnescapeDataString(userInfo[0]),
                Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
                SslMode = uri.Host == "localhost" || uri.Host == "127.0.0.1" ? SslMode.Prefer : SslMode.Require,
                NoResetOnClose = true
            };

            return builder.ToString();
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