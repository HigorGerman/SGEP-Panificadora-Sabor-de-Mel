using BackEnd.Repository;
using BackEnd.Services;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// --- Services (Configurações do Framework) ---
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// --- CORS (Integração com React/Vite) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("SGEP_Policy", policy => 
        policy.WithOrigins("http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

// --- Autenticação (JWT) ---
builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes("SuperSecretKeyThatIsAtLeast32BytesLong"))
        };
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
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

// --- Injeção de Dependência (Services) ---
builder.Services.AddScoped<UsuarioServices>();
builder.Services.AddScoped<ClienteServices>();
builder.Services.AddScoped<ProdutoServices>();
builder.Services.AddScoped<EncomendaServices>();
builder.Services.AddScoped<CategoriaService>();
builder.Services.AddScoped<TokenService>();

var app = builder.Build();

// --- Middleware Pipeline (Ordem de Execução) ---
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseCors("SGEP_Policy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();