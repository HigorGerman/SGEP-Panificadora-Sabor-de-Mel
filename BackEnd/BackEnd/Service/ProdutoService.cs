using BackEnd.Models;
using BackEnd.Repository;

namespace BackEnd.Services
{
    public class ProdutoServices
    {
        private readonly ProdutoRepository _repository;
        private readonly ReceitaRepository _receitaRepository;

        public ProdutoServices(ProdutoRepository repository, ReceitaRepository receitaRepository)
        {
            _repository = repository;
            _receitaRepository = receitaRepository;
        }

        public bool Criar(Produto produto)
        {
            var ok = _repository.Criar(produto);
            if (ok && produto.Receita != null)
            {
                produto.Receita.ProdutoId = produto.Id;
                _receitaRepository.Salvar(produto.Receita);
            }
            return ok;
        }

        public List<Produto> Listar()
        {
            return _repository.Listar();
        }

        public List<Produto> ListarComReceitas()
        {
            return _repository.ListarComReceitas();
        }

        public bool Alterar(Produto produto)
        {
            var ok = _repository.Alterar(produto);
            if (ok && produto.Receita != null)
            {
                produto.Receita.ProdutoId = produto.Id;
                _receitaRepository.Salvar(produto.Receita);
            }
            return ok;
        }

        public bool AlterarReceita(Receita receita)
        {
            return _receitaRepository.Salvar(receita);
        }

        public bool Excluir(int id)
        {
            return _repository.Excluir(id);
        }

        public Produto? ObterPorId(int id)
        {
            var produto = _repository.ObterPorId(id);
            if (produto != null)
            {
                produto.Receita = _receitaRepository.ObterPorProduto(id);
            }
            return produto;
        }
    }
}