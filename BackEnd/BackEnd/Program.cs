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
            .AllowAnyHeader());
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

var app = builder.Build();

// --- Middleware Pipeline (Ordem de Execução) ---
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseCors("SGEP_Policy");
app.UseAuthorization();
app.MapControllers();

app.Run();