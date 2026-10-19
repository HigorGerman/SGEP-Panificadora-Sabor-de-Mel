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

        /// <summary>
        /// Solicita o envio de token de 6 dígitos por e-mail para recuperação de senha
        /// </summary>
        [HttpPost("solicitar-recuperacao-senha")]
        public async Task<IActionResult> SolicitarRecuperacaoSenha([FromBody] SolicitarRecuperacaoSenhaDTO dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Email))
                {
                    return BadRequest(new { erro = "E-mail é obrigatório." });
                }

                await _services.SolicitarRecuperacaoSenhaAsync(dto.Email);
                return Ok(new { mensagem = "Se o e-mail estiver cadastrado em nosso sistema, um código de verificação de 6 dígitos foi enviado." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao processar solicitação de recuperação de senha.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Redefine a senha do cliente validando o token de 6 dígitos enviado por e-mail
        /// </summary>
        [HttpPost("redefinir-senha")]
        public IActionResult RedefinirSenha([FromBody] RedefinirSenhaDTO dto)
        {
            try
            {
                bool sucesso = _services.RedefinirSenha(dto.Email, dto.CodigoToken, dto.NovaSenha);
                if (sucesso)
                {
                    return Ok(new { mensagem = "Senha redefinida com sucesso! Você já pode realizar o login." });
                }
                return BadRequest(new { erro = "Não foi possível redefinir a senha." });
            }
            catch (ArgumentException argEx)
            {
                return BadRequest(new { erro = argEx.Message });
            }
            catch (InvalidOperationException invEx)
            {
                return BadRequest(new { erro = invEx.Message });
            }
            catch (KeyNotFoundException knfEx)
            {
                return NotFound(new { erro = knfEx.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro interno ao redefinir a senha.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Dispara token de confirmação para o e-mail do cliente logado para exclusão de conta
        /// </summary>
        [Authorize]
        [HttpPost("solicitar-exclusao-conta")]
        public async Task<IActionResult> SolicitarExclusaoConta()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized("Usuário não autenticado.");
                }

                await _services.SolicitarExclusaoContaAsync(userId);
                return Ok(new { mensagem = "Código de confirmação de exclusão enviado para o seu e-mail." });
            }
            catch (KeyNotFoundException knfEx)
            {
                return NotFound(new { erro = knfEx.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao solicitar exclusão de conta.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Valida o token de 6 dígitos e executa a desativação (soft delete) da conta do cliente logado
        /// </summary>
        [Authorize]
        [HttpPost("confirmar-exclusao-conta")]
        public IActionResult ConfirmarExclusaoConta([FromBody] ConfirmarExclusaoContaDTO dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized("Usuário não autenticado.");
                }

                bool sucesso = _services.ConfirmarExclusaoConta(userId, dto.CodigoToken);
                if (sucesso)
                {
                    return Ok(new { mensagem = "Sua conta foi desativada com sucesso. Sentiremos sua falta!" });
                }
                return BadRequest(new { erro = "Não foi possível confirmar a exclusão da conta." });
            }
            catch (ArgumentException argEx)
            {
                return BadRequest(new { erro = argEx.Message });
            }
            catch (InvalidOperationException invEx)
            {
                return BadRequest(new { erro = invEx.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao confirmar exclusão de conta.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Solicita o envio de token de 6 dígitos por e-mail para autorizar alterações no perfil ou senha do cliente logado
        /// </summary>
        [Authorize]
        [HttpPost("solicitar-codigo-alteracao")]
        public async Task<IActionResult> SolicitarCodigoAlteracao()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized("Usuário não autenticado.");
                }

                await _services.SolicitarCodigoAlteracaoPerfilAsync(userId);
                return Ok(new { mensagem = "Código de confirmação de 6 dígitos enviado para o seu e-mail." });
            }
            catch (KeyNotFoundException knfEx)
            {
                return NotFound(new { erro = knfEx.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao solicitar código de alteração de perfil.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Atualiza os dados do perfil (e opcionalmente a senha) do cliente logado mediante verificação de token de 6 dígitos
        /// </summary>
        [Authorize]
        [HttpPut("perfil-com-codigo")]
        public IActionResult AlterarPerfilComCodigo([FromBody] AlterarPerfilComCodigoDTO dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized("Usuário não autenticado.");
                }

                bool sucesso = _services.AlterarPerfilComCodigo(userId, dto);
                if (sucesso)
                {
                    return Ok(new { mensagem = "Perfil e preferências atualizados com sucesso!" });
                }
                return BadRequest(new { erro = "Não foi possível atualizar os dados do perfil." });
            }
            catch (ArgumentException argEx)
            {
                return BadRequest(new { erro = argEx.Message });
            }
            catch (InvalidOperationException invEx)
            {
                return BadRequest(new { erro = invEx.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao atualizar perfil com código.", detalhe = ex.Message });
            }
        }
    }
}