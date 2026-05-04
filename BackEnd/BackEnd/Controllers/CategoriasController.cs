using BackEnd.Models;
using BackEnd.Services;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CategoriasController : ControllerBase
    {
        private readonly CategoriaService _services;

        public CategoriasController(CategoriaService services)
        {
            _services = services;
        }

        [HttpPost]
        public IActionResult Gravar([FromBody] Categoria categoria)
        {
            try
            {
                if (string.IsNullOrEmpty(categoria.Descricao))
                    return BadRequest("A descrição da categoria é obrigatória.");

                var ok = _services.Criar(categoria);
                if (ok) return Created("", new { mensagem = "Categoria cadastrada!", id = categoria.Id });
                return BadRequest("Erro ao salvar categoria.");
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }

        [HttpGet]
        public IActionResult Listar()
        {
            return Ok(_services.Listar());
        }

        [HttpPut("{id}")]
        public IActionResult Alterar(int id, [FromBody] Categoria categoria)
        {
            categoria.Id = id;
            return _services.Alterar(categoria) ? Ok() : BadRequest();
        }

        [HttpDelete("{id}")]
        public IActionResult Excluir(int id)
        {
            try
            {
                var resultado = _services.Excluir(id);
                return Ok(new { mensagem = resultado });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensagem = "Erro ao excluir categoria." });
            }
        }
    }
}
