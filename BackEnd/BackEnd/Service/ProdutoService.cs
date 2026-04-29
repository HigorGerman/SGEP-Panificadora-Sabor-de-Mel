using BackEnd.Models;
using BackEnd.Repository;

namespace BackEnd.Services
{
    public class ProdutoServices
    {
        private readonly ProdutoRepository _repository;

        public ProdutoServices(ProdutoRepository repository)
        {
            _repository = repository;
        }

        public bool Criar(Produto produto)
        {
            return _repository.Criar(produto);
        }

        public List<Produto> Listar()
        {
            return _repository.Listar();
        }

        public bool Alterar(Produto produto)
        {
            return _repository.Alterar(produto);
        }

        public bool Excluir(int id)
        {
            return _repository.Excluir(id);
        }
    }
}