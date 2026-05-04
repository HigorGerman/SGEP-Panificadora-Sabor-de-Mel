using BackEnd.Models;
using BackEnd.Repository;

namespace BackEnd.Services
{
    public class CategoriaService
    {
        private readonly CategoriaRepository _repository;

        public CategoriaService(CategoriaRepository repository)
        {
            _repository = repository;
        }

        public bool Criar(Categoria categoria)
        {
            return _repository.Criar(categoria);
        }

        public List<Categoria> Listar()
        {
            return _repository.Listar();
        }

        public bool Alterar(Categoria categoria)
        {
            return _repository.Alterar(categoria);
        }

        public string Excluir(int id)
        {
            return _repository.Excluir(id);
        }
    }
}
