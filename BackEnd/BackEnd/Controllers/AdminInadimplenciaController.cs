using System;
using BackEnd.Controllers.DTOS;
using BackEnd.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [ApiController]
    public class AdminInadimplenciaController : ControllerBase
    {
        private readonly ClienteServices _clienteServices;
        private readonly EmailService _emailService;

        public AdminInadimplenciaController(ClienteServices clienteServices, EmailService emailService)
        {
            _clienteServices = clienteServices;
            _emailService = emailService;
        }

        /// <summary>
        /// Listagem gerencial de clientes inadimplentes ou bloqueados
        /// GET /api/admin/inadimplencia?busca=termo&apenasBloqueados=true
        /// </summary>
        [HttpGet("api/admin/inadimplencia")]
        [Authorize(Roles = "0,1,Admin,Atendente,Funcionario")]
        public IActionResult ListarInadimplentes([FromQuery] string? busca, [FromQuery] bool apenasBloqueados = false)
        {
            try
            {
                var clientes = _clienteServices.ListarInadimplentes(busca, apenasBloqueados);
                return Ok(clientes);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao listar clientes inadimplentes: " + ex.Message);
                return StatusCode(500, new { message = "Erro ao buscar inadimplência de clientes.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Alternar status de bloqueio manual de clientes
        /// PATCH /api/admin/clientes/{id}/bloqueio
        /// </summary>
        [HttpPatch("api/admin/clientes/{id:int}/bloqueio")]
        [Authorize(Roles = "0,1,Admin,Atendente,Funcionario")]
        public IActionResult AlternarBloqueio(int id, [FromBody] AlterarBloqueioRequestDTO dto)
        {
            try
            {
                var cliente = _clienteServices.ObterPorId(id);
                if (cliente == null)
                {
                    return NotFound(new { message = "Cliente não encontrado." });
                }

                var sucesso = _clienteServices.AlternarBloqueio(id, dto.BloqueadoEncomendas, dto.MotivoBloqueio);
                if (sucesso)
                {
                    string acao = dto.BloqueadoEncomendas ? "bloqueado para novas encomendas" : "desbloqueado com sucesso";
                    return Ok(new { 
                        message = $"Cliente {cliente.Nome} foi {acao}.",
                        clienteId = id,
                        bloqueadoEncomendas = dto.BloqueadoEncomendas,
                        motivoBloqueio = dto.MotivoBloqueio
                    });
                }

                return BadRequest(new { message = "Não foi possível atualizar o status de bloqueio do cliente." });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao alterar bloqueio do cliente: " + ex.Message);
                return StatusCode(500, new { message = "Erro ao atualizar bloqueio do cliente.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Endpoint rápido para a tela de retirada/balcão ou caixa consultar a situação do CPF em tempo real
        /// GET /api/admin/clientes/verificar-cpf/{cpf}
        /// e GET /api/clientes/verificar-cpf/{cpf} (para validação imediata em tela de encomenda)
        /// </summary>
        [HttpGet("api/admin/clientes/verificar-cpf/{cpf}")]
        [HttpGet("api/clientes/verificar-cpf/{cpf}")]
        [AllowAnonymous]
        public IActionResult VerificarCpf(string cpf)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(cpf))
                {
                    return BadRequest(new { message = "CPF não informado para verificação." });
                }

                var resultado = _clienteServices.VerificarSituacao(null, cpf);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao verificar situação do CPF: " + ex.Message);
                return StatusCode(500, new { message = "Erro ao verificar situação do CPF.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Consulta por ID do Cliente
        /// GET /api/admin/clientes/{id}/verificar-situacao
        /// e GET /api/clientes/{id}/verificar-situacao
        /// </summary>
        [HttpGet("api/admin/clientes/{id:int}/verificar-situacao")]
        [HttpGet("api/clientes/{id:int}/verificar-situacao")]
        [AllowAnonymous]
        public IActionResult VerificarClientePorId(int id)
        {
            try
            {
                var resultado = _clienteServices.VerificarSituacao(id, null);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao verificar situação do cliente.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Enviar notificação de cobrança por e-mail com o resumo dos valores em aberto
        /// POST /api/admin/clientes/{id}/notificar-cobranca
        /// </summary>
        [HttpPost("api/admin/clientes/{id:int}/notificar-cobranca")]
        [Authorize(Roles = "0,1,Admin,Atendente,Funcionario")]
        public async System.Threading.Tasks.Task<IActionResult> EnviarNotificacaoCobranca(int id)
        {
            try
            {
                var cliente = _clienteServices.ObterPorId(id);
                if (cliente == null)
                {
                    return NotFound(new { message = "Cliente não encontrado." });
                }

                if (string.IsNullOrWhiteSpace(cliente.Email))
                {
                    return BadRequest(new { message = "Cliente não possui e-mail cadastrado para envio de notificação." });
                }

                var situacao = _clienteServices.VerificarSituacao(id, null);
                if (situacao.QtdEncomendasPendentes == 0 && situacao.ValorTotalDevido == 0)
                {
                    return BadRequest(new { message = "Cliente não possui pendências financeiras registradas no momento." });
                }

                var enviado = await _emailService.EnviarNotificacaoInadimplenciaAsync(
                    cliente.Email, 
                    cliente.Nome, 
                    situacao.QtdEncomendasPendentes, 
                    situacao.ValorTotalDevido
                );

                if (enviado)
                {
                    return Ok(new { 
                        message = $"Notificação de cobrança enviada com sucesso para {cliente.Email}!",
                        destinatario = cliente.Email
                    });
                }

                return StatusCode(500, new { message = "Falha ao enviar e-mail de notificação." });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erro ao enviar notificação de cobrança: " + ex.Message);
                return StatusCode(500, new { message = "Erro ao processar envio de cobrança.", detalhe = ex.Message });
            }
        }
    }
}
