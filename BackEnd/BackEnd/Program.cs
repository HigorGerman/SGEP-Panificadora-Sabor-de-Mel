using BackEnd.Repository;
using BackEnd.Services;
using Scalar.AspNetCore;
using MercadoPago.Config;

var builder = WebApplication.CreateBuilder(args);

// --- Suporte a Porta Dinâmica de Plataformas em Nuvem (Railway / Render / Fly.io) ---
var cloudPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(cloudPort))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{cloudPort}");
}

// --- Configuração do Mercado Pago ---
MercadoPagoConfig.AccessToken = Environment.GetEnvironmentVariable("MERCADOPAGO_ACCESS_TOKEN")
                                ?? builder.Configuration["MercadoPago:AccessToken"];

// --- Services (Configurações do Framework) ---
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// --- CORS (Integração com Next.js Local e Nuvem / Vercel) ---
var frontendUrlConfig = Environment.GetEnvironmentVariable("FRONTEND_URL")
                        ?? builder.Configuration["FrontendUrl"]
                        ?? "http://localhost:3000";

var allowedOrigins = frontendUrlConfig
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Select(o => o.TrimEnd('/'))
    .Union(new[] { "http://localhost:3000" })
    .ToHashSet(StringComparer.OrdinalIgnoreCase);

builder.Services.AddCors(options =>
{
    options.AddPolicy("SGEP_Policy", policy =>
        policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;
                var normalized = origin.TrimEnd('/');
                if (allowedOrigins.Contains(normalized)) return true;
                if (Uri.TryCreate(normalized, UriKind.Absolute, out var uri) &&
                    uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
                return false;
            })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

// --- Autenticação (JWT) ---
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
                ?? builder.Configuration["Jwt:Key"]
                ?? "SuperSecretKeyThatIsAtLeast32BytesLong";

builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSecret))
        };
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    context.Token = authHeader.Substring("Bearer ".Length).Trim();
                    return System.Threading.Tasks.Task.CompletedTask;
                }

                var token = context.Request.Cookies["jwt"];
                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }
                return System.Threading.Tasks.Task.CompletedTask;
            }
        };
    });

// --- Injeção de Dependência (Banco de Dados) ---
builder.Services.AddScoped<PostgresDbContext>();

// --- Injeção de Dependência (Repositórios) ---
builder.Services.AddScoped<UsuarioRepository>();
builder.Services.AddScoped<ClienteRepository>();
builder.Services.AddScoped<ProdutoRepository>();
builder.Services.AddScoped<EncomendaRepository>();
builder.Services.AddScoped<CategoriaRepository>();
builder.Services.AddScoped<ReceitaRepository>();
builder.Services.AddScoped<IPagamentoRepository, PagamentoRepository>();
builder.Services.AddScoped<TokenAutenticacaoRepository>();

// --- Injeção de Dependência (Services) ---
builder.Services.AddScoped<UsuarioServices>();
builder.Services.AddScoped<ClienteServices>();
builder.Services.AddScoped<ProdutoServices>();
builder.Services.AddScoped<EncomendaServices>();
builder.Services.AddScoped<CategoriaService>();
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<IPagamentoService, PagamentoService>();
builder.Services.AddScoped<EmailService>();

var app = builder.Build();

// --- Inicialização Automática do Banco de Dados (Tabelas + Seed Inicial) ---
if (args.Contains("--reset-db"))
{
    DatabaseInitializer.ResetDatabase(app.Services);
    return;
}
DatabaseInitializer.EnsureDatabaseInitialized(app.Services);

// --- Middleware Pipeline (Ordem de Execução) ---
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
    app.UseHttpsRedirection();
}

app.UseCors("SGEP_Policy");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "SGEP API", timestamp = DateTime.UtcNow }));
app.MapControllers();

app.Run();