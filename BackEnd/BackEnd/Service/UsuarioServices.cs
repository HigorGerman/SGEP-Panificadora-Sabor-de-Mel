using BackEnd.Models;
using BackEnd.Repository;

namespace BackEnd.Services
{
    public class UsuarioServices
    {
        private readonly UsuarioRepository _repository;

        public UsuarioServices(UsuarioRepository repository)
        {
            _repository = repository;
        }

        public bool Criar(Usuario usuario)
        {
            return _repository.Criar(usuario);
        }

        public List<Usuario> Listar()
        {
            return _repository.Listar();
        }

        public bool Alterar(Usuario usuario)
        {
            return _repository.Alterar(usuario);
        }

        public bool Excluir(int id)
        {
            return _repository.Excluir(id);
        }
        
       
        public Usuario? Autenticar(string email, string senha)
        {
            return _repository.ObterPorEmailESenha(email, senha);
        }
    }
}