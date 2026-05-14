using BackEnd.Controllers.DTOS;
using BackEnd.Models;
using BackEnd.Services;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UsuariosController : ControllerBase
    {
        // Declaramos os dois serviços aqui no topo
        private readonly UsuarioServices _usuarioServices;
        private readonly ClienteServices _clienteServices;
        private readonly TokenService _tokenService;

        // O construtor agora recebe os dois. O ASP.NET resolve isso sozinho para você.
        public UsuariosController(UsuarioServices usuarioServices, ClienteServices clienteServices, TokenService tokenService)
        {
            _usuarioServices = usuarioServices;
            _clienteServices = clienteServices;
            _tokenService = tokenService;
        }

        [HttpPost]
        public IActionResult Criar(UsuarioCriarRequest request)
        {
            try
            {
                var usuario = new Usuario
                {
                    UsuarioNome = request.UsuarioNome,
                    Email = request.Email,
                    Senha = request.Senha,
                    Perfil = (Usuario.PerfilEnum)request.Perfil
                };

                // Mudamos de _services para _usuarioServices aqui
                var sucesso = _usuarioServices.Criar(usuario);

                if (sucesso)
                {
                    var response = new UsuarioResponse
                    {
                        Id = usuario.Id,
                        UsuarioNome = usuario.UsuarioNome,
                        Email = usuario.Email,
                        Perfil = (int)usuario.Perfil
                    };
                    return Created("", response);
                }

                return BadRequest("Não foi possível criar o usuário.");
            }
            catch (Exception ex)
            {
                return Problem(detail: ex.Message, statusCode: 500);
            }
        }

        [HttpGet]
        public IActionResult Listar()
        {
            // Mudamos de _services para _usuarioServices aqui
            var usuarios = _usuarioServices.Listar().Select(u => new UsuarioResponse {
                Id = u.Id,
                UsuarioNome = u.UsuarioNome,
                Email = u.Email,
                Perfil = (int)u.Perfil
            });
            return Ok(usuarios);
        }

        [HttpPut("{id}")]
        public IActionResult Alterar(int id, UsuarioCriarRequest request)
        {
            var usuario = new Usuario { 
                Id = id, 
                UsuarioNome = request.UsuarioNome, 
                Email = request.Email, 
                Perfil = (Usuario.PerfilEnum)request.Perfil 
            };
            // Mudamos de _services para _usuarioServices aqui
            return _usuarioServices.Alterar(usuario) ? Ok() : BadRequest();
        }

        [HttpDelete("{id}")]
        public IActionResult Excluir(int id)
        {
            // Mudamos de _services para _usuarioServices aqui
            return _usuarioServices.Excluir(id) ? Ok() : BadRequest();
        }
        
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequestDTO loginDto)
        {
            // 1. Tenta autenticar como Usuário
            var usuario = _usuarioServices.Autenticar(loginDto.Email, loginDto.Senha);
            if (usuario != null)
            {
                var token = _tokenService.GenerateToken(usuario.Id.ToString(), ((int)usuario.Perfil).ToString(), usuario.UsuarioNome);
                AppendTokenCookie(token);

                return Ok(new { 
                    Id = usuario.Id, 
                    Nome = usuario.UsuarioNome, 
                    Role = ((int)usuario.Perfil).ToString(), 
                    Tipo = "Usuario" 
                });
            }

            // 2. Tenta autenticar como Cliente
            var cliente = _clienteServices.Autenticar(loginDto.Email, loginDto.Senha);
            if (cliente != null)
            {
                var token = _tokenService.GenerateToken(cliente.Id.ToString(), "Cliente", cliente.Nome);
                AppendTokenCookie(token);

                return Ok(new { 
                    Id = cliente.Id, 
                    Nome = cliente.Nome, 
                    Role = "Cliente", 
                    Tipo = "Cliente" 
                });
            }

            return Unauthorized(new { message = "E-mail ou senha incorretos." });
        }

        private void AppendTokenCookie(string token)
        {
            Response.Cookies.Append("jwt", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Idealmente em produção. O SameSite=Strict requer HTTPS se Secure=true na maioria dos browsers modernos (ou localhost).
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddHours(8)
            });
        }
    }
}