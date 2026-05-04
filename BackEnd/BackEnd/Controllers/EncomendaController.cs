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

        public EncomendaController(EncomendaServices encomendaServices)
        {
            _encomendaServices = encomendaServices;
        }

        [HttpPost]
        public IActionResult Criar([FromBody] EncomendaCreateDto dto)
        {
            try
            {
                var encomenda = new Encomenda
                {
                    ClienteId = dto.ClienteId,
                    UsuarioId = dto.UsuarioId,
                    DataEntrega = dto.DataEntrega,
                    Observacao = dto.Observacao,
                    Status = Encomenda.StatusEnum.Pendente,
                    Itens = dto.Itens.Select(i => new ItemEncomenda
                    {
                        ProdutoId = i.ProdutoId,
                        Quantidade = i.Quantidade
                    }).ToList()
                };

                var sucesso = _encomendaServices.Criar(encomenda);
                if (sucesso)
                    return Ok(new { message = "Encomenda criada com sucesso!" });

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
                        Quantidade = i.Quantidade
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
    }
}