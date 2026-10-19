using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BackEnd.Models;
using BackEnd.Repository;

namespace BackEnd.Services
{
    public class ClienteServices
    {
        private readonly ClienteRepository _repository;
        private readonly TokenAutenticacaoRepository _tokenRepository;
        private readonly EmailService _emailService;

        public ClienteServices(
            ClienteRepository repository,
            TokenAutenticacaoRepository tokenRepository,
            EmailService emailService)
        {
            _repository = repository;
            _tokenRepository = tokenRepository;
            _emailService = emailService;
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

        public bool AlterarPerfil(Cliente cliente)
        {
            return _repository.AlterarPerfil(cliente);
        }

        public bool Excluir(int id)
        {
            return _repository.Excluir(id);
        }

        public Cliente? Autenticar(string email, string senha)
        {
            return _repository.ObterPorEmailESenha(email, senha);
        }

        public async Task<bool> SolicitarRecuperacaoSenhaAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;

            var cliente = _repository.ObterPorEmail(email);
            if (cliente == null)
            {
                // Retornamos true para prevenir enumeração de e-mails, por boas práticas de segurança
                return true;
            }

            // Invalida tokens anteriores do mesmo tipo
            _tokenRepository.InvalidarTokensAnteriores(cliente.Id, "RECUPERACAO_SENHA");

            // Gera código aleatório de 6 dígitos numéricos
            string codigoToken = Random.Shared.Next(100000, 999999).ToString();

            var token = new TokenAutenticacao
            {
                ClienteId = cliente.Id,
                CodigoToken = codigoToken,
                TipoToken = "RECUPERACAO_SENHA",
                DataExpiracao = DateTime.UtcNow.AddMinutes(15),
                Utilizado = false
            };

            bool salvou = _tokenRepository.Criar(token);
            if (salvou)
            {
                await _emailService.EnviarCodigoRecuperacaoSenhaAsync(cliente.Email ?? email, cliente.Nome, codigoToken);
                return true;
            }

            return false;
        }

        public bool RedefinirSenha(string email, string codigoToken, string novaSenha)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(codigoToken) || string.IsNullOrWhiteSpace(novaSenha))
            {
                throw new ArgumentException("E-mail, código token e nova senha são obrigatórios.");
            }

            if (novaSenha.Length < 6)
            {
                throw new ArgumentException("A nova senha deve ter no mínimo 6 caracteres.");
            }

            var cliente = _repository.ObterPorEmail(email);
            if (cliente == null)
            {
                throw new KeyNotFoundException("Cliente não encontrado com o e-mail informado.");
            }

            var tokenValido = _tokenRepository.ObterTokenValido(cliente.Id, codigoToken, "RECUPERACAO_SENHA");
            if (tokenValido == null)
            {
                throw new InvalidOperationException("Código de verificação inválido ou expirado. Solicite um novo código.");
            }

            // Criptografa a nova senha com BCrypt
            string novaSenhaHash = BCrypt.Net.BCrypt.HashPassword(novaSenha);

            bool atualizou = _repository.AtualizarSenha(cliente.Id, novaSenhaHash);
            if (atualizou)
            {
                _tokenRepository.MarcarComoUtilizado(tokenValido.Id);
                return true;
            }

            return false;
        }

        public async Task<bool> SolicitarExclusaoContaAsync(int clienteId)
        {
            var clientes = _repository.Listar();
            var cliente = clientes.Find(c => c.Id == clienteId);
            if (cliente == null || string.IsNullOrWhiteSpace(cliente.Email))
            {
                throw new KeyNotFoundException("Cliente não encontrado.");
            }

            _tokenRepository.InvalidarTokensAnteriores(cliente.Id, "EXCLUSAO_CONTA");

            string codigoToken = Random.Shared.Next(100000, 999999).ToString();

            var token = new TokenAutenticacao
            {
                ClienteId = cliente.Id,
                CodigoToken = codigoToken,
                TipoToken = "EXCLUSAO_CONTA",
                DataExpiracao = DateTime.UtcNow.AddMinutes(15),
                Utilizado = false
            };

            bool salvou = _tokenRepository.Criar(token);
            if (salvou)
            {
                await _emailService.EnviarCodigoExclusaoContaAsync(cliente.Email, cliente.Nome, codigoToken);
                return true;
            }

            return false;
        }

        public bool ConfirmarExclusaoConta(int clienteId, string codigoToken)
        {
            if (string.IsNullOrWhiteSpace(codigoToken))
            {
                throw new ArgumentException("O código de confirmação é obrigatório.");
            }

            var tokenValido = _tokenRepository.ObterTokenValido(clienteId, codigoToken, "EXCLUSAO_CONTA");
            if (tokenValido == null)
            {
                throw new InvalidOperationException("Código de confirmação inválido ou expirado.");
            }

            bool desativou = _repository.ExcluirSoftDelete(clienteId);
            if (desativou)
            {
                _tokenRepository.MarcarComoUtilizado(tokenValido.Id);
                return true;
            }

            return false;
        }

        public async Task<bool> SolicitarCodigoAlteracaoPerfilAsync(int clienteId)
        {
            var clientes = _repository.Listar();
            var cliente = clientes.Find(c => c.Id == clienteId);
            if (cliente == null || string.IsNullOrWhiteSpace(cliente.Email))
            {
                throw new KeyNotFoundException("Cliente não encontrado.");
            }

            _tokenRepository.InvalidarTokensAnteriores(cliente.Id, "ALTERACAO_PERFIL");

            string codigoToken = Random.Shared.Next(100000, 999999).ToString();

            var token = new TokenAutenticacao
            {
                ClienteId = cliente.Id,
                CodigoToken = codigoToken,
                TipoToken = "ALTERACAO_PERFIL",
                DataExpiracao = DateTime.UtcNow.AddMinutes(15),
                Utilizado = false
            };

            bool salvou = _tokenRepository.Criar(token);
            if (salvou)
            {
                await _emailService.EnviarCodigoAlteracaoPerfilAsync(cliente.Email, cliente.Nome, codigoToken);
                return true;
            }

            return false;
        }

        public bool AlterarPerfilComCodigo(int clienteId, Controllers.DTOS.AlterarPerfilComCodigoDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.CodigoToken))
            {
                throw new ArgumentException("O código de verificação é obrigatório.");
            }

            var tokenValido = _tokenRepository.ObterTokenValido(clienteId, dto.CodigoToken, "ALTERACAO_PERFIL");
            if (tokenValido == null)
            {
                throw new InvalidOperationException("Código de verificação inválido ou expirado.");
            }

            var cliente = new Cliente
            {
                Id = clienteId,
                Nome = dto.Nome,
                Telefone = dto.Telefone,
                RestricaoGluten = dto.RestricaoGluten,
                RestricaoLactose = dto.RestricaoLactose,
                RestricaoAcucar = dto.RestricaoAcucar
            };

            bool atualizouPerfil = _repository.AlterarPerfil(cliente);
            if (!atualizouPerfil)
            {
                return false;
            }

            // Se fornecida nova senha, atualiza também a senha
            if (!string.IsNullOrWhiteSpace(dto.NovaSenha))
            {
                if (dto.NovaSenha.Length < 6)
                {
                    throw new ArgumentException("A nova senha deve possuir no mínimo 6 caracteres.");
                }
                string hashSenha = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
                _repository.AtualizarSenha(clienteId, hashSenha);
            }

            _tokenRepository.MarcarComoUtilizado(tokenValido.Id);
            return true;
        }

        public Cliente? ObterPorId(int id)
        {
            return _repository.ObterPorId(id);
        }

        public Cliente? ObterPorCpf(string cpf)
        {
            return _repository.ObterPorCpf(cpf);
        }

        public List<Controllers.DTOS.ClienteInadimplenciaItemDTO> ListarInadimplentes(string? busca, bool apenasBloqueados)
        {
            return _repository.ListarInadimplentes(busca, apenasBloqueados);
        }

        public bool AlternarBloqueio(int clienteId, bool bloqueado, string? motivo)
        {
            return _repository.AtualizarBloqueio(clienteId, bloqueado, motivo);
        }

        public Controllers.DTOS.VerificarCpfResponseDTO VerificarSituacao(int? clienteId, string? cpf)
        {
            return _repository.ObterSituacaoFinanceiraCliente(clienteId, cpf);
        }
    }
}