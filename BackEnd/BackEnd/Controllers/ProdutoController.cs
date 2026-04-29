using BackEnd.Controllers.DTOS;
using BackEnd.Models;
using BackEnd.Services;
using Microsoft.AspNetCore.Mvc;

namespace BackEnd.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ProdutosController : ControllerBase
    {
        private readonly ProdutoServices _services;

        public ProdutosController(ProdutoServices services)
        {
            _services = services;
        }

        [HttpPost]
        public IActionResult Gravar(ProdutoCriarRequest request)
        {
            try
            {
                // --- Regras de Negócio na Controller ---
                if (string.IsNullOrEmpty(request.Nome))
                    return BadRequest("O nome do produto é obrigatório.");

                if (request.PrecoUnitario <= 0)
                    return BadRequest("O preço do produto deve ser maior que zero.");

                if (request.CategoriaId <= 0)
                    return BadRequest("Informe uma categoria válida.");

                // Mapeia DTO -> Entidade
                var produto = new Produto
                {
                    Nome = request.Nome,
                    PrecoUnitario = request.PrecoUnitario,
                    CategoriaId = request.CategoriaId
                };

                var ok = _services.Criar(produto);

                if (ok)
                    return Created("", new { mensagem = "Produto cadastrado!", id = produto.Id });

                return BadRequest("Erro ao salvar produto.");
            }
            catch (Exception ex)
            {
                return Problem(ex.Message);
            }
        }
        
        [HttpGet]
        public IActionResult Listar()
        {
            var produtos = _services.Listar().Select(p => new ProdutoResponse {
                Id = p.Id,
                Nome = p.Nome,
                PrecoUnitario = p.PrecoUnitario,
                CategoriaId = p.CategoriaId,
                ImagemUrl = p.ImagemUrl
            });
            return Ok(produtos);
        }

        [HttpPut("{id}")]
        public IActionResult Alterar(int id, ProdutoCriarRequest request)
        {
            if (request.PrecoUnitario <= 0) return BadRequest("Preço inválido.");
    
            var produto = new Produto {
                Id = id,
                Nome = request.Nome,
                PrecoUnitario = request.PrecoUnitario,
                CategoriaId = request.CategoriaId
            };
            return _services.Alterar(produto) ? Ok() : BadRequest();
        }

        [HttpDelete("{id}")]
        public IActionResult Excluir(int id)
        {
            return _services.Excluir(id) ? Ok() : BadRequest();
        }
    }
}