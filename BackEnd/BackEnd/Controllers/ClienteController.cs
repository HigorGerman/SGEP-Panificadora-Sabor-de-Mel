using BackEnd.Controllers.DTOS;
using BackEnd.Models;
using BackEnd.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BackEnd.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ClientesController : ControllerBase
    {
        private readonly ClienteServices _services;

        public ClientesController(ClienteServices services)
        {
            _services = services;
        }

        [HttpPost]
        public IActionResult Gravar(ClienteCriarRequest request)
        {
            try
            {
                // --- Regras de Negócio (Validações na Controller) ---
                if (string.IsNullOrEmpty(request.Nome))
                {
                    return BadRequest("O nome do cliente é obrigatório.");
                }

                if (string.IsNullOrEmpty(request.Email) && string.IsNullOrEmpty(request.Telefone))
                {
                    return BadRequest("É necessário informar ao menos um contato (E-mail ou Telefone).");
                }

                // --- Mapeamento DTO -> Entidade ---
                var cliente = new Cliente
                {
                    Nome = request.Nome,
                    Cpf = request.Cpf,
                    Email = request.Email,
                    Senha = request.Senha,
                    Telefone = request.Telefone,
                    RestricaoGluten = request.RestricaoGluten,
                    RestricaoLactose = request.RestricaoLactose,
                    RestricaoAcucar = request.RestricaoAcucar,
                    Ativo = true
                };

                // --- Chamada da Service (Padrão 1 linha) ---
                var sucesso = _services.Criar(cliente);

                if (sucesso)
                {
                    // Retornamos o objeto que foi criado (opcional, mas boa prática)
                    return Created("", new { mensagem = "Cliente cadastrado com sucesso!", id = cliente.Id });
                }

                return BadRequest("Não foi possível realizar o cadastro.");
            }
            catch (Exception ex)
            {
                // Tratamento de erro robusto para o ambiente de desenvolvimento
                return Problem(detail: ex.Message, statusCode: 500);
            }
        }
        
        [HttpGet]
        public IActionResult Listar()
        {
            var clientes = _services.Listar().Select(c => new ClienteResponse {
                Id = c.Id,
                Nome = c.Nome,
                Email = c.Email,
                Cpf = c.Cpf,
                Telefone = c.Telefone,
                RestricaoGluten = c.RestricaoGluten,
                RestricaoLactose = c.RestricaoLactose,
                RestricaoAcucar = c.RestricaoAcucar
            });
            return Ok(clientes);
        }

        [HttpGet("{id}")]
        public IActionResult ObterPorId(int id)
        {
            var cliente = _services.Listar().FirstOrDefault(c => c.Id == id);
            if (cliente == null) return NotFound();
            
            return Ok(new ClienteResponse {
                Id = cliente.Id,
                Nome = cliente.Nome,
                Email = cliente.Email,
                Cpf = cliente.Cpf,
                Telefone = cliente.Telefone,
                RestricaoGluten = cliente.RestricaoGluten,
                RestricaoLactose = cliente.RestricaoLactose,
                RestricaoAcucar = cliente.RestricaoAcucar
            });
        }

        [HttpDelete("{id}")]
        public IActionResult Excluir(int id)
        {
            return _services.Excluir(id) ? Ok() : BadRequest();
        }

        [Authorize]
        [HttpPut("perfil")]
        public IActionResult AtualizarPerfil(ClienteUpdatePerfilRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized("Usuário não autenticado corretamente.");
            }

            var cliente = new Cliente
            {
                Id = userId,
                Nome = request.Nome,
                Telefone = request.Telefone,
                RestricaoGluten = request.RestricaoGluten,
                RestricaoLactose = request.RestricaoLactose,
                RestricaoAcucar = request.RestricaoAcucar
            };

            var sucesso = _services.AlterarPerfil(cliente);
            if (sucesso)
            {
                return Ok(new { mensagem = "Perfil atualizado com sucesso!" });
            }

            return BadRequest("Não foi possível atualizar o perfil.");
        }
    }
}