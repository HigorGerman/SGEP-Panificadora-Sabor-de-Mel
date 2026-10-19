using BackEnd.Controllers.DTOS;
using BackEnd.Models;
using BackEnd.Services;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EncomendaController : ControllerBase
    {
        private readonly EncomendaServices _encomendaServices;
        private readonly ClienteServices _clienteServices;

        public EncomendaController(EncomendaServices encomendaServices, ClienteServices clienteServices)
        {
            _encomendaServices = encomendaServices;
            _clienteServices = clienteServices;
        }

        [HttpPost]
        public IActionResult Criar([FromBody] EncomendaCreateDto dto)
        {
            try
            {
                // 1. Validação de Inadimplência e Bloqueio de Clientes
                string? avisoPendencia = null;
                int? clienteIdResolvido = dto.ClienteId;

                if (dto.ClienteId.HasValue || !string.IsNullOrWhiteSpace(dto.Cpf))
                {
                    var situacao = _clienteServices.VerificarSituacao(dto.ClienteId, dto.Cpf);
                    if (!clienteIdResolvido.HasValue && situacao.ClienteId.HasValue)
                    {
                        clienteIdResolvido = situacao.ClienteId;
                    }

                    // Se bloqueado_encomendas == true: retornar 403 Forbidden
                    if (situacao.BloqueadoEncomendas)
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new { 
                            message = "Cliente temporariamente impossibilitado de realizar encomendas online. Favor contactar o balcão da panificadora.",
                            motivo = situacao.MotivoBloqueio,
                            bloqueado = true
                        });
                    }

                    // Se possuir 2 ou mais encomendas pendentes/não pagas: bloquear automaticamente
                    if (situacao.QtdEncomendasPendentes >= 2)
                    {
                        return BadRequest(new { 
                            message = $"Cliente possui {situacao.QtdEncomendasPendentes} encomendas pendentes/não pagas anteriores. Regularize as pendências no balcão antes de realizar novos pedidos.",
                            qtdPendencias = situacao.QtdEncomendasPendentes,
                            valorTotalDevido = situacao.ValorTotalDevido,
                            bloqueioAutomatico = true
                        });
                    }

                    // Se possuir 1 encomenda pendente: emitir alerta no payload de retorno
                    if (situacao.QtdEncomendasPendentes == 1)
                    {
                        avisoPendencia = "Atenção: Identificamos uma encomenda anterior pendente de confirmação no balcão.";
                    }
                }

                var encomenda = new Encomenda
                {
                    ClienteId = clienteIdResolvido,
                    UsuarioId = dto.UsuarioId,
                    DataEntrega = dto.DataEntrega,
                    Observacao = dto.Observacao,
                    Status = Encomenda.StatusEnum.Pendente,
                    Itens = dto.Itens.Select(i => new ItemEncomenda
                    {
                        ProdutoId = i.ProdutoId,
                        Quantidade = i.Quantidade,
                        EspecificacoesTecnicas = i.EspecificacoesTecnicas
                    }).ToList()
                };

                var sucesso = _encomendaServices.Criar(encomenda);
                if (sucesso)
                {
                    return Ok(new { 
                        message = "Encomenda criada com sucesso!", 
                        id = encomenda.Id,
                        aviso = avisoPendencia
                    });
                }

                return BadRequest(new { message = "Erro ao criar encomenda." });
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                return StatusCode(500, new { message = e.Message });
            }
        }

        [HttpGet]
        public IActionResult Listar()
        {
            try
            {
                var encomendas = _encomendaServices.Listar();
                return Ok(encomendas);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                return StatusCode(500, new { message = e.Message });
            }
        }

        [HttpGet("{id:int}")]
        public IActionResult ObterPorId(int id)
        {
            try
            {
                var encomenda = _encomendaServices.ObterPorId(id);
                if (encomenda == null)
                    return NotFound(new { message = "Encomenda não encontrada." });

                return Ok(encomenda);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                return StatusCode(500, new { message = e.Message });
            }
        }
        
        [HttpPut("{id:int}")]
        public IActionResult Atualizar(int id, [FromBody] EncomendaCreateDto dto)
        {
            try
            {
                var encomendaExistente = _encomendaServices.ObterPorId(id);
                if (encomendaExistente == null)
                    return NotFound(new { message = "Encomenda não encontrada para atualizar." });

                var encomenda = new Encomenda
                {
                    Id = id,
                    ClienteId = dto.ClienteId,
                    UsuarioId = dto.UsuarioId,
                    DataEntrega = dto.DataEntrega,
                    Observacao = dto.Observacao,
                    Status = encomendaExistente.Status, // Preserve status, could have a separate endpoint
                    Itens = dto.Itens.Select(i => new ItemEncomenda
                    {
                        ProdutoId = i.ProdutoId,
                        Quantidade = i.Quantidade,
                        EspecificacoesTecnicas = i.EspecificacoesTecnicas
                    }).ToList()
                };

                var sucesso = _encomendaServices.Atualizar(encomenda);
                if (sucesso) 
                    return Ok(new { message = "Encomenda atualizada com sucesso!" });
                
                return BadRequest(new { message = "Erro ao atualizar encomenda." });
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                return StatusCode(500, new { message = e.Message });
            }
        }

        [HttpDelete("{id:int}")]
        public IActionResult Deletar(int id)
        {
            try
            {
                var sucesso = _encomendaServices.Excluir(id);
                if (sucesso) 
                    return Ok(new { message = "Encomenda excluída com sucesso!" });
                
                return BadRequest(new { message = "Erro ao excluir encomenda." });
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                return StatusCode(500, new { message = e.Message });
            }
        }

        [HttpGet("detalhes")]
        public IActionResult ListarComDetalhes()
        {
            try
            {
                var encomendas = _encomendaServices.ListarComDetalhes();
                return Ok(encomendas);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                return StatusCode(500, new { message = e.Message });
            }
        }

        public class StatusUpdateDto { public int Status { get; set; } }

        [HttpPatch("{id:int}/status")]
        public IActionResult AtualizarStatus(int id, [FromBody] StatusUpdateDto dto)
        {
            try
            {
                var sucesso = _encomendaServices.AtualizarStatus(id, (Encomenda.StatusEnum)dto.Status);
                if (sucesso) return Ok(new { message = "Status atualizado com sucesso!" });
                return BadRequest(new { message = "Erro ao atualizar status." });
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                return StatusCode(500, new { message = e.Message });
            }
        }

        public class EntregaDto { public int? UsuarioId { get; set; } }

        [HttpPost("{id:int}/entrega")]
        public IActionResult RegistrarEntrega(int id, [FromBody] EntregaDto dto)
        {
            try
            {
                var sucesso = _encomendaServices.RegistrarEntrega(id, dto?.UsuarioId);
                if (sucesso) return Ok(new { message = "Entrega registrada com sucesso!" });
                return BadRequest(new { message = "Erro ao registrar entrega." });
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                return BadRequest(new { message = e.Message });
            }
        }
    }
}