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
                if (string.IsNullOrEmpty(request.Nome))
                    return BadRequest("O nome do produto é obrigatório.");

                if (request.PrecoUnitario <= 0)
                    return BadRequest("O preço do produto deve ser maior que zero.");

                if (request.CategoriaId <= 0)
                    return BadRequest("Informe uma categoria válida.");

                var produto = new Produto
                {
                    Nome = request.Nome,
                    PrecoUnitario = request.PrecoUnitario,
                    CategoriaId = request.CategoriaId,
                    Descricao = request.Descricao,
                    Receita = new Receita {
                        Ingredientes = request.Ingredientes,
                        ModoPreparo = request.ModoPreparo,
                        Rendimento = request.Rendimento
                    }
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
                ImagemUrl = p.ImagemUrl,
                Descricao = p.Descricao
            });
            return Ok(produtos);
        }

        [HttpGet("com-receitas")]
        public IActionResult ListarComReceitas()
        {
            var produtos = _services.ListarComReceitas().Select(p => new ProdutoResponse {
                Id = p.Id,
                Nome = p.Nome,
                PrecoUnitario = p.PrecoUnitario,
                CategoriaId = p.CategoriaId,
                ImagemUrl = p.ImagemUrl,
                Descricao = p.Descricao,
                Ingredientes = p.Receita?.Ingredientes,
                ModoPreparo = p.Receita?.ModoPreparo,
                Rendimento = p.Receita?.Rendimento
            });
            return Ok(produtos);
        }

        [HttpGet("{id:int}")]
        public IActionResult ObterPorId(int id)
        {
            var produto = _services.ObterPorId(id);
            if (produto == null) return NotFound();

            return Ok(new ProdutoResponse {
                Id = produto.Id,
                Nome = produto.Nome,
                PrecoUnitario = produto.PrecoUnitario,
                CategoriaId = produto.CategoriaId,
                ImagemUrl = produto.ImagemUrl,
                Descricao = produto.Descricao,
                Ingredientes = produto.Receita?.Ingredientes,
                ModoPreparo = produto.Receita?.ModoPreparo,
                Rendimento = produto.Receita?.Rendimento
            });
        }

        [HttpPut("{id:int}")]
        public IActionResult Alterar(int id, ProdutoCriarRequest request)
        {
            if (request.PrecoUnitario <= 0) return BadRequest("Preço inválido.");
    
            var produto = new Produto {
                Id = id,
                Nome = request.Nome,
                PrecoUnitario = request.PrecoUnitario,
                CategoriaId = request.CategoriaId,
                Descricao = request.Descricao,
                Receita = new Receita {
                    Ingredientes = request.Ingredientes,
                    ModoPreparo = request.ModoPreparo,
                    Rendimento = request.Rendimento
                }
            };
            return _services.Alterar(produto) ? Ok() : BadRequest();
        }

        public class ReceitaUpdateRequest {
            public string? Ingredientes { get; set; }
            public string? ModoPreparo { get; set; }
            public string? Rendimento { get; set; }
        }

        [HttpPut("{id:int}/receita")]
        public IActionResult AlterarReceita(int id, [FromBody] ReceitaUpdateRequest request)
        {
            var receita = new Receita {
                ProdutoId = id,
                Ingredientes = request.Ingredientes,
                ModoPreparo = request.ModoPreparo,
                Rendimento = request.Rendimento
            };
            return _services.AlterarReceita(receita) ? Ok() : BadRequest("Erro ao salvar receita.");
        }

        [HttpDelete("{id:int}")]
        public IActionResult Excluir(int id)
        {
            try {
                return _services.Excluir(id) ? Ok() : BadRequest();
            } catch (Exception ex) {
                return BadRequest(new { mensagem = ex.Message });
            }
        }
    }
}