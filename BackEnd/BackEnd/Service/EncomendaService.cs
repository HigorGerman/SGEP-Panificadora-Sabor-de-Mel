using BackEnd.Repository;
using BackEnd.Models;

namespace BackEnd.Services
{
    public class EncomendaServices
    {
        private readonly EncomendaRepository _repository;
        private readonly ProdutoRepository _produtoRepository;

        public EncomendaServices(EncomendaRepository repository, ProdutoRepository produtoRepository)
        {
            _repository = repository;
            _produtoRepository = produtoRepository;
        }

        public bool Criar(Encomenda encomenda)
        {
            decimal total = 0;
            if (encomenda.Itens != null)
            {
                foreach (var item in encomenda.Itens)
                {
                    var produto = _produtoRepository.ObterPorId(item.ProdutoId);
                    if (produto != null)
                    {
                        item.PrecoUnitario = produto.PrecoUnitario;
                        total += (item.PrecoUnitario * item.Quantidade);
                    }
                }
            }
            encomenda.ValorTotal = total;

            return _repository.Criar(encomenda);
        }

        public List<Encomenda> Listar()
        {
            return _repository.Listar();
        }

        public Encomenda? ObterPorId(int id)
        {
            return _repository.ObterPorId(id);
        }

        public bool Atualizar(Encomenda encomenda)
        {
            decimal total = 0;
            if (encomenda.Itens != null)
            {
                foreach (var item in encomenda.Itens)
                {
                    var produto = _produtoRepository.ObterPorId(item.ProdutoId);
                    if (produto != null)
                    {
                        item.PrecoUnitario = produto.PrecoUnitario;
                        total += (item.PrecoUnitario * item.Quantidade);
                    }
                }
            }
            encomenda.ValorTotal = total;

            return _repository.Atualizar(encomenda);
        }

        public bool Excluir(int id)
        {
            return _repository.Excluir(id);
        }

        public List<Encomenda> ListarComDetalhes()
        {
            return _repository.ListarComDetalhes();
        }

        public bool AtualizarStatus(int id, Encomenda.StatusEnum status)
        {
            return _repository.AtualizarStatus(id, status);
        }
    }
}