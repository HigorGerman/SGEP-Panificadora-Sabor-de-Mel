using BackEnd.Models;
using BackEnd.Repository;

namespace BackEnd.Services
{
    public class ClienteServices
    {
        private readonly ClienteRepository _repository;

        public ClienteServices(ClienteRepository repository)
        {
            _repository = repository;
        }

        public bool Criar(Cliente cliente)
        {
            return _repository.Criar(cliente);
        }

        public List<Cliente> Listar()
        {
            return _repository.Listar();
        }

        public bool Alterar(Cliente cliente)
        {
            return _repository.Alterar(cliente);
        }

        public bool Excluir(int id)
        {
            return _repository.Excluir(id);
        }
        
        public Cliente? Autenticar(string email, string senha) 
        {
            return _repository.ObterPorEmailESenha(email, senha);
        }
    }
}