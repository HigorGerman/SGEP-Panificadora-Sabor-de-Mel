# Documentação das Estórias de Usuário Implementadas (ERS)
## Detalhamento Técnico do Backend e Interface Gráfica

Este documento reúne as especificações técnicas das estórias de usuário da ERS que já foram **implementadas** no sistema **SGEP**. Para cada item, é fornecido um espaço para anexação de print da tela e o mapeamento detalhado da arquitetura backend (tecnologias, métodos, tabelas e relacionamentos).

---

## 1. Gerenciar Usuários (F1)
* **Objetivo**: Cadastro, consulta, edição e exclusão de operadores (administradores e funcionários).

### 🖥️ Interface Gráfica (Frontend)
* **Arquivo**: [usuarios/page.tsx](file:///Users/germano/Documents/SGEP/frontend/src/app/usuarios/page.tsx)
* **Descrição da UI**: Painel administrativo contendo tabela listando os usuários ativos, botões de ação para abrir o modal de cadastro/edição, formulário de preenchimento e confirmação de exclusão.

> [!NOTE]
> **[INSERIR PRINT DA INTERFACE DE GERENCIAMENTO DE USUÁRIOS AQUI]**

### ⚙️ Detalhamento do Backend
* **Tecnologias**: C# .NET 10.0, ADO.NET com Npgsql (driver do PostgreSQL), BCrypt.Net-Next (criptografia segura de senhas).
* **Camadas e Métodos**:
  * **Controlador**: `UsuariosController` ([UsuariosController.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/UsuariosController.cs))
    * `Criar(UsuarioCriarRequest request)`: Recebe a rota POST para inserção.
    * `Listar()`: Recebe a rota GET para listar usuários ativos.
    * `Alterar(int id, UsuarioCriarRequest request)`: Recebe a rota PUT para atualizar dados cadastrais.
    * `Excluir(int id)`: Recebe a rota DELETE.
    * `Login(LoginRequestDTO loginDto)`: Valida e-mail e senha.
  * **Serviço**: `UsuarioServices` ([UsuarioServices.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/UsuarioServices.cs))
  * **Repositório**: `UsuarioRepository` ([UsuarioRepository.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/UsuarioRepository.cs))
    * `Criar(Usuario usuario)`: Insere o registro criptografando a senha com `BCrypt.HashPassword`.
    * `ObterPorEmailESenha(string email, string senha)`: Autentica o usuário e atualiza automaticamente senhas antigas legadas em texto puro para hash BCrypt.
    * `Excluir(int id)`: Executa uma consulta preventiva. Se houver encomendas no nome do funcionário, executa um `UPDATE` definindo `excluido = true` (exclusão lógica). Se não houver vínculos, executa um `DELETE` físico.
* **Banco de Dados**:
  * **Tabela**: `usuario`
  * **Colunas**: `id` (INT, SERIAL, PRIMARY KEY), `usuario_nome` (VARCHAR), `email` (VARCHAR, UNIQUE), `senha` (VARCHAR), `perfil_enum` (INT - 0 para Admin e 1 para Funcionário), `excluido` (BOOLEAN, DEFAULT false).
* **Relacionamentos**:
  * Associação de 1:N com `encomenda` (`encomenda.usuario_id` referenciando `usuario(id)`).
  * Associação de 1:N com `encomenda` como entregador (`encomenda.usuario_entrega_id` referenciando `usuario(id)`).

---

## 2. Gerenciar Clientes / CRM (F2)
* **Objetivo**: Cadastro e manutenção cadastral de clientes da panificadora e definição de restrições alimentares.

### 🖥️ Interface Gráfica (Frontend)
* **Arquivos**: [registro/page.tsx](file:///Users/germano/Documents/SGEP/frontend/src/app/registro/page.tsx) (Cadastro de conta) e [perfil/page.tsx](file:///Users/germano/Documents/SGEP/frontend/src/app/perfil/page.tsx) (Configuração de dados e intolerâncias).
* **Descrição da UI**: Tela de registro público com formulário de dados e checkboxes para restrições a glúten/lactose/açúcar. Tela de perfil para edição das preferências de saúde alimentar do cliente.

> [!NOTE]
> **[INSERIR PRINT DAS INTERFACES DE REGISTRO E PERFIL DO CLIENTE AQUI]**

### ⚙️ Detalhamento do Backend
* **Tecnologias**: C# .NET 10.0, ADO.NET com Npgsql, BCrypt.Net-Next.
* **Camadas e Métodos**:
  * **Controlador**: `ClienteController` ([ClienteController.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/ClienteController.cs))
    * `Criar(ClienteCriarRequest request)`: Rota POST pública para autocadastro.
    * `AlterarPerfil(ClienteCriarRequest request)`: Rota PUT para atualização própria de dados pelo cliente.
    * `Excluir(int id)`: Rota DELETE.
  * **Serviço**: `ClienteServices` ([ClienteService.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/ClienteService.cs))
  * **Repositório**: `ClienteRepository` ([ClienteRepository.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/ClienteRepository.cs))
    * `Criar(Cliente cliente)`: Insere o registro de cliente com flags de segurança e senha hash.
    * `Excluir(int id)`: Se o cliente possuir encomendas cadastradas, atualiza `ativo = false` (exclusão lógica), caso contrário realiza `DELETE` físico.
* **Banco de Dados**:
  * **Tabela**: `cliente`
  * **Colunas**: `id` (PK, SERIAL), `nome` (VARCHAR), `cpf` (VARCHAR, NULLABLE), `email` (VARCHAR, NULLABLE), `senha` (VARCHAR, NULLABLE), `telefone` (VARCHAR, NULLABLE), `restricao_gluten` (BOOLEAN), `restricao_lactose` (BOOLEAN), `restricao_acucar` (BOOLEAN), `ativo` (BOOLEAN, DEFAULT true).
* **Relacionamentos**:
  * Associação de 1:N com `encomenda` (`encomenda.cliente_id` referenciando `cliente(id)`).

---

## 3. Gerenciar Categorias de Produtos (F3)
* **Objetivo**: Cadastrar grupos lógicos de classificação dos itens de panificação.

### 🖥️ Interface Gráfica (Frontend)
* **Arquivo**: [categorias/page.tsx](file:///Users/germano/Documents/SGEP/frontend/src/app/categorias/page.tsx)
* **Descrição da UI**: Tela administrativa simples contendo listagem de categorias cadastradas, botão de criação e exclusão, além de indicação de inatividade.

> [!NOTE]
> **[INSERIR PRINT DA INTERFACE DE CATEGORIAS AQUI]**

### ⚙️ Detalhamento do Backend
* **Tecnologias**: C# .NET 10.0, ADO.NET com Npgsql.
* **Camadas e Métodos**:
  * **Controlador**: `CategoriasController` ([CategoriasController.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/CategoriasController.cs))
  * **Serviço**: `CategoriaService` ([CategoriaService.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/CategoriaService.cs))
  * **Repositório**: `CategoriaRepository` ([CategoriaRepository.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/CategoriaRepository.cs))
    * `Criar(Categoria categoria)`: Comando SQL `INSERT INTO categoria`.
    * `Excluir(int id)`: Executa query preventiva. Se a categoria possuir produtos vinculados, faz `UPDATE categoria SET inativo = true` para manter a integridade referencial. Se estiver vazia, faz o `DELETE` físico.
* **Banco de Dados**:
  * **Tabela**: `categoria`
  * **Colunas**: `id` (PK SERIAL), `descricao` (VARCHAR), `inativo` (BOOLEAN, DEFAULT false).
* **Relacionamentos**:
  * Associação de 1:N com a tabela `produto` (`produto.categoria_id` referenciando `categoria(id)`).

---

## 4. Gerenciar Produtos (F4)
* **Objetivo**: Cadastro detalhado do cardápio comercial da padaria, informando preço base, permissão de customização e composição de alergênicos.

### 🖥️ Interface Gráfica (Frontend)
* **Arquivo**: [produtos/page.tsx](file:///Users/germano/Documents/SGEP/frontend/src/app/produtos/page.tsx)
* **Descrição da UI**: Grid/lista de produtos cadastrados com foto, preço, descrição e flags de ingredientes. Modais de inclusão/edição integrando checkboxes de customização e campos de saúde.

> [!NOTE]
> **[INSERIR PRINT DA INTERFACE DE PRODUTOS AQUI]**

### ⚙️ Detalhamento do Backend
* **Tecnologias**: C# .NET 10.0, ADO.NET com Npgsql.
* **Camadas e Métodos**:
  * **Controlador**: `ProdutosController` ([ProdutosController.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/ProdutoController.cs))
  * **Serviço**: `ProdutoServices` ([ProdutoService.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/ProdutoService.cs))
  * **Repositório**: `ProdutoRepository` ([ProdutoRepository.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/ProdutoRepository.cs))
    * `Criar(Produto produto)`: SQL `INSERT` que faz cast explícito do template de customização enviado (`CAST(@templateCustomizacao AS jsonb)`).
    * `Excluir(int id)`: Remove preventivamente a receita do produto e deleta o item. Bloqueia a exclusão disparando exceção amigável se o produto estiver atrelado a itens de encomendas existentes no banco (erro Postgres code `23503`).
* **Banco de Dados**:
  * **Tabela**: `produto`
  * **Colunas**: `id` (PK SERIAL), `nome` (VARCHAR), `preco_unitario` (NUMERIC), `categoria_id` (FK `categoria`), `imagem_url` (VARCHAR), `descricao` (TEXT), `permite_customizacao` (BOOLEAN), `template_customizacao` (JSONB, NULLABLE), `contem_gluten` (BOOLEAN), `contem_lactose` (BOOLEAN), `contem_acucar` (BOOLEAN).
* **Relacionamentos**:
  * Muitos para Um (N:1) com `categoria` (`categoria_id` FK).
  * Um para Um (1:1) com `receita`.
  * Um para Muitos (1:N) com `item_encomenda`.

---

## 5. Gerenciar Receitas - Módulo Privado (F5)
* **Objetivo**: Cadastro de fórmulas confidenciais de confecção de produtos, com uso restrito à cozinha.

### 🖥️ Interface Gráfica (Frontend)
* **Arquivo**: [receitas/page.tsx](file:///Users/germano/Documents/SGEP/frontend/src/app/receitas/page.tsx)
* **Descrição da UI**: Tela gerencial voltada a padeiros/confeiteiros exibindo a lista de produtos e uma gaveta colapsável (drawer) ou modal para inserção da lista de ingredientes, rendimento e modo de preparo passo a passo.

> [!NOTE]
> **[INSERIR PRINT DA INTERFACE DE RECEITAS AQUI]**

### ⚙️ Detalhamento do Backend
* **Tecnologias**: C# .NET 10.0, ADO.NET com Npgsql.
* **Camadas e Métodos**:
  * **Controlador**: `ProdutosController` ([ProdutosController.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/ProdutoController.cs#L161-L171) - rota `PUT {id}/receita`)
  * **Serviço**: `ProdutoServices` ([ProdutoService.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/ProdutoService.cs#L49-L52))
  * **Repositório**: `ReceitaRepository` ([ReceitaRepository.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/ReceitaRepository.cs))
    * `Salvar(Receita receita)`: Lógica híbrida ("upsert"). Primeiro verifica se já existe receita no ID do produto com `ObterPorProduto`. Se nulo, executa `INSERT INTO receita`. Caso contrário, executa `UPDATE receita`.
* **Banco de Dados**:
  * **Tabela**: `receita`
  * **Colunas**: `id` (PK SERIAL), `produto_id` (FK `produto` UNIQUE), `ingredientes` (TEXT), `modo_preparo` (TEXT), `rendimento` (VARCHAR).
* **Relacionamentos**:
  * Relação 1:1 com `produto`. A unicidade é forçada pela chave estrangeira `produto_id` marcada como `UNIQUE`. Possui deleção em cascata (`ON DELETE CASCADE`) atrelada ao produto pai.

---

## 6. Efetuar Encomenda Personalizada (F7)
* **Objetivo**: Possibilitar a clientes e atendentes criar pedidos de encomendas de produtos da panificadora.

### 🖥️ Interface Gráfica (Frontend)
* **Arquivo**: [nova-encomenda/page.tsx](file:///Users/germano/Documents/SGEP/frontend/src/app/nova-encomenda/page.tsx)
* **Descrição da UI**: Vitrine de produtos pesquisável com contador de quantidade e botão de adição ao carrinho. Carrinho lateral exibindo resumo do pedido, campo de data de retirada obrigatória com trava mínima de 24 horas de antecedência, e fechamento.

> [!NOTE]
> **[INSERIR PRINT DA VITRINE DE ENCOMENDAS E CARRINHO AQUI]**

### ⚙️ Detalhamento do Backend
* **Tecnologias**: C# .NET 10.0, ADO.NET com Npgsql com transações explícitas no repositório.
* **Camadas e Métodos**:
  * **Controlador**: `EncomendaController` ([EncomendaController.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/EncomendaController.cs))
    * `Criar(EncomendaCreateDto dto)`: Recebe o payload do pedido e aciona o serviço.
    * `ListarComDetalhes()`: Retorna as encomendas ativas com join de clientes.
  * **Serviço**: `EncomendaServices` ([EncomendaService.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/EncomendaService.cs))
    * `Criar(Encomenda encomenda)`: Lógica de segurança de precificação. Itera sobre cada item enviado, obtém o preço unitário atualizado diretamente da tabela `produto` no banco, calcula a multiplicação pela quantidade, soma o `ValorTotal` final e envia para inserção.
  * **Repositório**: `EncomendaRepository` ([EncomendaRepository.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/EncomendaRepository.cs))
    * `Criar(Encomenda encomenda)`: Abre uma conexão e inicia uma transação explícita (`conexao.BeginTransaction()`). Insere a linha de cabeçalho na tabela `encomenda` retornando o ID gerado. Em seguida, roda uma iteração inserindo as linhas de itens na tabela `item_encomenda` vinculados a este ID. Caso ocorra qualquer erro, executa `transacao.Rollback()`. Se tudo der certo, executa `transacao.Commit()`.
* **Banco de Dados**:
  * **Tabela**: `encomenda`
  * **Colunas**: `id` (PK SERIAL), `cliente_id` (FK `cliente` NULLABLE), `usuario_id` (FK `usuario` NULLABLE), `data_retirada` (TIMESTAMP), `valor_total` (NUMERIC), `status_enum` (INT - 0: Pendente, 1: Em Andamento, 2: Concluída, 3: Cancelada, 4: Entregue), `observacao` (TEXT).
* **Relacionamentos**:
  * Muitos para Um (N:1) com `cliente` (`cliente_id` FK).
  * Muitos para Um (N:1) com `usuario` criador (`usuario_id` FK).
  * Um para Muitos (1:N) com `item_encomenda` (relação de composição forte).

---

## 7. Vincular Especificações Técnicas ao Pedido (F8)
* **Objetivo**: Adicionar customizações detalhadas nos itens do pedido com base nas regras do produto.

### 🖥️ Interface Gráfica (Frontend)
* **Arquivo**: [nova-encomenda/page.tsx](file:///Users/germano/Documents/SGEP/frontend/src/app/nova-encomenda/page.tsx#L491-L528) (Função `proceedToAdd` e modal `customModalOpen`)
* **Descrição da UI**: Modal dinâmico aberto automaticamente ao selecionar um produto que permite personalização. O formulário gera campos de texto baseados na configuração técnica do produto.

> [!NOTE]
> **[INSERIR PRINT DO MODAL DE PERSONALIZAÇÃO DE PRODUTO AQUI]**

### ⚙️ Detalhamento do Backend
* **Tecnologias**: C# .NET 10.0, ADO.NET com Npgsql, coluna nativa do PostgreSQL do tipo JSONB.
* **Camadas e Métodos**:
  * **Controlador/Repositório**: Integrado ao fluxo de criação de encomenda (`EncomendaRepository.Criar`).
  * No momento de persistir o item da compra na tabela `item_encomenda`, o parâmetro correspondente é inserido utilizando cast direto no SQL: `INSERT INTO item_encomenda (... especificacoes_tecnicas) VALUES (... @specs::jsonb)`.
* **Banco de Dados**:
  * **Tabela**: `item_encomenda`
  * **Coluna**: `especificacoes_tecnicas` (tipo `JSONB`, NULLABLE).
* **Relacionamentos**:
  * Vinculado ao registro correspondente do item do pedido.

---

## 8. Validar Alertas de Segurança Alimentar (F9)
* **Objetivo**: Evitar erros operacionais alertando no carrinho caso o cliente adicione produtos com componentes que constam em suas restrições de alergia.

### 🖥️ Interface Gráfica (Frontend)
* **Arquivo**: [nova-encomenda/page.tsx](file:///Users/germano/Documents/SGEP/frontend/src/app/nova-encomenda/page.tsx#L158-L175) (Função `handleAddClick` e modal `healthAlertModalOpen`)
* **Descrição da UI**: Modal vermelho de Alerta de Saúde bloqueando a inserção imediata no carrinho caso detectada incompatibilidade. Exibe mensagem de risco detalhada e botões para cancelar ou aceitar ciente dos riscos.

> [!NOTE]
> **[INSERIR PRINT DO MODAL DE ALERTA DE SAÚDE ALIMENTAR AQUI]**

### ⚙️ Detalhamento do Backend
* **Tecnologias**: C# .NET 10.0, ADO.NET. A validação das chaves ocorre em tela no React, cruzando os atributos de intolerância salvos no cadastro do cliente com a composição cadastrada no produto.
* **Banco de Dados (Tabelas de Apoio)**:
  * Cruzamento em tempo de execução dos campos booleanos:
    * `cliente.restricao_gluten` (CRM) ↔ `produto.contem_gluten` (Catálogo)
    * `cliente.restricao_lactose` (CRM) ↔ `produto.contem_lactose` (Catálogo)
    * `cliente.restricao_acucar` (CRM) ↔ `produto.contem_acucar` (Catálogo)

---

## 9. Atualizar Status da Produção (F14)
* **Objetivo**: Acompanhar e atualizar o progresso produtivo da encomenda na fábrica/cozinha.

### 🖥️ Interface Gráfica (Frontend)
* **Arquivo**: [producao/page.tsx](file:///Users/germano/Documents/SGEP/frontend/src/app/producao/page.tsx)
* **Descrição da UI**: Painel Kanban ou em colunas dinâmicas separando as encomendas por status ("Pendente", "Em Produção", "Concluído"). Possui botões rápidos para avançar o status dos cartões de pedidos.

> [!NOTE]
> **[INSERIR PRINT DO PAINEL DO CRONOGRAMA DE PRODUÇÃO / KANBAN AQUI]**

### ⚙️ Detalhamento do Backend
* **Tecnologias**: C# .NET 10.0, ADO.NET com Npgsql.
* **Camadas e Métodos**:
  * **Controlador**: `EncomendaController` ([EncomendaController.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/EncomendaController.cs#L158-L172) - rota PATCH `api/encomenda/{id}/status`)
  * **Serviço**: `EncomendaServices` ([EncomendaService.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/EncomendaService.cs#L77-L80))
  * **Repositório**: `EncomendaRepository` ([EncomendaRepository.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/EncomendaRepository.cs#L319-L327))
    * `AtualizarStatus(int id, StatusEnum novoStatus)`: Executa query otimizada `UPDATE encomenda SET status_enum = @status WHERE id = @id`.
* **Banco de Dados**:
  * **Tabela**: `encomenda`
  * **Coluna**: `status_enum` (INT).

---

## 10. Registrar Entrega e Retirada de Pedido (F16)
* **Objetivo**: Confirmar a saída da encomenda física ao cliente, auditando a data de recebimento real e o funcionário entregador.

### 🖥️ Interface Gráfica (Frontend)
* **Arquivo**: [retirada/page.tsx](file:///Users/germano/Documents/SGEP/frontend/src/app/retirada/page.tsx)
* **Descrição da UI**: Tela gerencial com busca por código de encomenda ou dados do cliente, botão de "Registrar Retirada" com confirmação do nome e telefone do cliente e identificação do entregador da loja.

> [!NOTE]
> **[INSERIR PRINT DA INTERFACE DE RETIRADA E ENTREGA DE PEDIDOS AQUI]**

### ⚙️ Detalhamento do Backend
* **Tecnologias**: C# .NET 10.0, ADO.NET com Npgsql.
* **Camadas e Métodos**:
  * **Controlador**: `EncomendaController` ([EncomendaController.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/EncomendaController.cs#L176-L190) - rota POST `api/encomenda/{id}/entrega`)
  * **Serviço**: `EncomendaServices` ([EncomendaService.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/EncomendaService.cs#L82-L85))
  * **Repositório**: `EncomendaRepository` ([EncomendaRepository.cs](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/EncomendaRepository.cs#L329-L380))
    * `RegistrarEntrega(int id, int? usuarioEntregaId)`: Executa uma checagem prévia na tabela `pagamento` para validar a quitação do pedido (`SELECT status FROM pagamento WHERE encomenda_id = @id`). Se o status não constar como `'pago'` ou `'concluido'`, rejeita a transação lançando exceção protetiva. Se quitado, atualiza as colunas de finalização da tabela `encomenda`.
* **Banco de Dados**:
  * **Tabela**: `encomenda`
  * **Colunas Atualizadas**: `status_enum = 4` (Entregue), `data_entrega_real` (TIMESTAMP atualizada no fuso de Brasília), `usuario_entrega_id` (FK `usuario`).
* **Relacionamentos**:
  * Muitos para Um (N:1) com a tabela `usuario` (`usuario_entrega_id` FK).
  * Um para Um (1:1 na prática de validação) com a tabela `pagamento` (`encomenda_id` FK).
