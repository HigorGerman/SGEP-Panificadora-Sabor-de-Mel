# Especificação de Modelagem e Arquitetura para as 20 Funções da ERS
## Guia de Apoio para Diagrama de Classes e Diagrama Entidade-Relacionamento (ER)

Este documento foi elaborado para orientar a construção do **Diagrama de Classes de Contexto** e do **Diagrama Entidade-Relacionamento (ER)** do **SGEP (Panificadora Sabor de Mel)**. Para cada uma das 20 funções da ERS, são descritos os fluxos, classes de negócio, atributos impactados, relacionamentos e dicas específicas de modelagem.

---

## 1. Mapeamento de Entidades e Tabelas Core
Para contextualizar, estas são as entidades básicas presentes no sistema:
1. **`Usuario`** (Tabela `usuario`): Gerencia operadores do sistema (Admin e Funcionários).
2. **`Cliente`** (Tabela `cliente`): Clientes atendidos pela panificadora (com preferências alimentares).
3. **`Categoria`** (Tabela `categoria`): Grupos de produtos (ex: Bolos, Pães).
4. **`Produto`** (Tabela `produto`): Catálogo de produtos da panificadora.
5. **`Receita`** (Tabela `receita`): Instruções secretas de produção de um produto.
6. **`Encomenda`** (Tabela `encomenda`): Cabeçalho do pedido do cliente.
7. **`ItemEncomenda`** (Tabela `item_encomenda`): Itens de produtos vinculados a um pedido.
8. **`Pagamento`** (Tabela `pagamento`): Controle financeiro, sinal e saldo devedor de uma encomenda.
9. **`Caixa`** (Tabela `caixa`): Turno financeiro de vendas diárias.

---

## 2. Detalhamento das 20 Funções

### Função 1: Gerenciar Usuários
* **Objetivo**: Cadastro, consulta, alteração e exclusão lógica de administradores e funcionários.
* **Diagrama de Classes**:
  * **Classe**: `Usuario`
  * **Atributos**: `Id: int`, `UsuarioNome: string`, `Email: string`, `Senha: string`, `Perfil: PerfilEnum` (Admin=0, Funcionario=1), `Excluido: bool`.
  * **Métodos (Service/Repository)**: `Criar(Usuario)`, `Listar()`, `Alterar(Usuario)`, `Excluir(id)`.
* **Diagrama ER (Banco de Dados)**:
  * **Tabela**: `usuario`
  * **Colunas**: `id` (PK SERIAL), `usuario_nome` (VARCHAR), `email` (VARCHAR, UNIQUE), `senha` (VARCHAR), `perfil_enum` (INT), `excluido` (BOOLEAN).
* **Diretiva de Modelagem**: Associação direta de `Usuario` (1) para `Encomenda` (N) como registrador ou entregador da encomenda. A exclusão é lógica (`excluido = true`) para manter o histórico de auditoria física.

---

### Função 2: Gerenciar Clientes (CRM)
* **Objetivo**: Cadastro e manutenção de dados de clientes, englobando informações de contato e preferências alimentares.
* **Diagrama de Classes**:
  * **Classe**: `Cliente`
  * **Atributos**: `Id: int`, `Nome: string`, `Cpf: string`, `Email: string`, `Senha: string` (nulo se cadastrado sem conta), `Telefone: string`, `RestricaoGluten: bool`, `RestricaoLactose: bool`, `RestricaoAcucar: bool`, `Ativo: bool`.
  * **Métodos**: `Criar(Cliente)`, `Listar()`, `Alterar(Cliente)`, `Excluir(id)`.
* **Diagrama ER**:
  * **Tabela**: `cliente`
  * **Colunas**: `id` (PK), `nome`, `cpf`, `email` (UNIQUE), `senha`, `telefone`, `restricao_gluten`, `restricao_lactose`, `restricao_acucar`, `ativo`.
* **Diretiva de Modelagem**: Relacionamento 1:N com a classe `Encomenda`. Clientes inativados têm `ativo = false` para preservar dados de encomendas antigas.

---

### Função 3: Gerenciar Categorias de Produtos
* **Objetivo**: Classificar os produtos vendidos no sistema para facilitação do filtro de busca e relatórios.
* **Diagrama de Classes**:
  * **Classe**: `Categoria`
  * **Atributos**: `Id: int`, `Descricao: string`, `Inativo: bool`.
  * **Métodos**: `Criar(Categoria)`, `Listar()`, `Alterar(Categoria)`, `Excluir(id)`.
* **Diagrama ER**:
  * **Tabela**: `categoria`
  * **Colunas**: `id` (PK), `descricao`, `inativo`.
* **Diretiva de Modelagem**: Relacionamento de 1:N com `Produto`. Se uma categoria possui produtos ativos e for solicitada sua exclusão, ela deve apenas ser marcada como `inativa = true`.

---

### Função 4: Gerenciar Produtos
* **Objetivo**: Cadastro do catálogo de produtos físicos, preços e restrições alimentares.
* **Diagrama de Classes**:
  * **Classe**: `Produto`
  * **Atributos**: `Id: int`, `Nome: string`, `PrecoUnitario: decimal`, `CategoriaId: int`, `ImagemUrl: string`, `Descricao: string`, `PermiteCustomizacao: bool`, `TemplateCustomizacao: string` (JSON), `ContemGluten: bool`, `ContemLactose: bool`, `ContemAcucar: bool`.
  * **Associação**: `Categoria` (Propriedade de Navegação), `Receita` (1:1 opcional).
  * **Métodos**: `Criar(Produto)`, `Listar()`, `Alterar(Produto)`, `Excluir(id)`.
* **Diagrama ER**:
  * **Tabela**: `produto`
  * **Colunas**: `id` (PK), `nome`, `preco_unitario` (NUMERIC), `categoria_id` (FK `categoria`), `imagem_url`, `descricao`, `permite_customizacao`, `template_customizacao` (JSONB), `contem_gluten`, `contem_lactose`, `contem_acucar`.
* **Diretiva de Modelagem**:
  * Chave Estrangeira: `categoria_id` aponta para `categoria(id)`.
  * Relacionamento 1:N com `ItemEncomenda` e 1:1 com `Receita`.

---

### Função 5: Gerenciar Receitas (Módulo Privado)
* **Objetivo**: Armazenar as fórmulas de preparo dos produtos com acesso confidencial para a cozinha.
* **Diagrama de Classes**:
  * **Classe**: `Receita`
  * **Atributos**: `Id: int`, `ProdutoId: int`, `Ingredientes: string`, `ModoPreparo: string`, `Rendimento: string`.
  * **Métodos**: `Salvar(Receita)`, `ObterPorProduto(produtoId)`.
* **Diagrama ER**:
  * **Tabela**: `receita`
  * **Colunas**: `id` (PK), `produto_id` (FK `produto` UNIQUE), `ingredientes` (TEXT), `modo_preparo` (TEXT), `rendimento`.
* **Diretiva de Modelagem**: Relacionamento 1:1 com `Produto`. A chave estrangeira `produto_id` deve possuir uma restrição de unicidade (`UNIQUE`) e deleção em cascata (`ON DELETE CASCADE`), pois a receita não existe sem o produto.

---

### Função 6: Gerenciar Permissões de Receitas
* **Objetivo**: Validar se o usuário logado possui a credencial necessária para visualizar receitas (ex: apenas perfil Administrador ou Padeiro).
* **Diagrama de Classes**:
  * **Classes Envolvidas**: `Usuario` (especificamente `PerfilEnum`), `TokenService` ou `AuthService`.
  * **Método**: `ValidarAcessoReceita(Usuario)` ou verificação via anotação de rota (ex: `Authorize(Roles="Admin")`).
* **Diagrama ER**: Não demanda tabela própria no banco. É uma checagem comportamental baseada na coluna `usuario.perfil_enum`.
* **Diretiva de Modelagem**: No Diagrama de Classes de Contexto, adicione uma dependência entre o controlador de Receitas/Produtos e o serviço de autenticação (`TokenService`).

---

### Função 7: Efetuar Encomenda Personalizada
* **Objetivo**: Criação de pedidos com múltiplos itens, datas agendadas de retirada e cálculo de valores.
* **Diagrama de Classes**:
  * **Classes**: `Encomenda` e `ItemEncomenda`.
  * **Atributos de `Encomenda`**: `Id: int`, `ClienteId: int?`, `UsuarioId: int?`, `DataEntrega: DateTime`, `Status: StatusEnum`, `ValorTotal: decimal`, `Observacao: string`.
  * **Composição**: Lista de `ItemEncomenda`.
  * **Métodos**: `Criar(Encomenda)`, `ObterPorId(id)`, `ListarComDetalhes()`.
* **Diagrama ER**:
  * **Tabela**: `encomenda`
  * **Colunas**: `id` (PK), `cliente_id` (FK `cliente`, NULLABLE), `usuario_id` (FK `usuario`, NULLABLE), `data_retirada` (TIMESTAMP), `valor_total`, `status_enum` (INT), `observacao`.
* **Diretiva de Modelagem**: Relação de agregação fraca com `Cliente` (pois o cliente_id pode ser nulo se for venda rápida/avulsa) e composição forte de `Encomenda` para com `ItemEncomenda` (remover Encomenda remove seus itens).

---

### Função 8: Vincular Especificações Técnicas ao Pedido
* **Objetivo**: Anexar as customizações escolhidas para cada item da encomenda (ex: sabor do recheio, texto personalizado escrito no bolo).
* **Diagrama de Classes**:
  * **Classe**: `ItemEncomenda`
  * **Atributos**: `Id: int`, `EncomendaId: int`, `ProdutoId: int`, `Quantidade: int`, `PrecoUnitario: decimal`, `EspecificacoesTecnicas: string` (representação JSON das customizações).
* **Diagrama ER**:
  * **Tabela**: `item_encomenda`
  * **Colunas**: `id` (PK), `encomenda_id` (FK `encomenda`), `produto_id` (FK `produto`), `quantidade`, `preco_no_ato` (NUMERIC), `especificacoes_tecnicas` (JSONB).
* **Diretiva de Modelagem**: A coluna `especificacoes_tecnicas` é mapeada como `JSONB` no Postgres para permitir estruturas flexíveis de personalização de acordo com o produto.

---

### Função 9: Validar Alertas de Segurança Alimentar
* **Objetivo**: Comparar automaticamente as restrições de alergia do cliente logado com os ingredientes/alertas do produto a ser adicionado ao carrinho, emitindo um alerta visual informativo no ato de adicionar ao carrinho.
* **Status**: **Concluído via Frontend** (implementado no React no componente de criação de encomenda).
* **Diagrama de Classes**:
  * **Componentes/Classes Envolvidas**: Componente `NovaEncomenda` (função `handleAddClick`), modelo `Cliente`, modelo `Produto`.
* **Diagrama ER**: Não exige tabelas adicionais. A validação cruza dados de restrições das tabelas através das colunas:
  * `cliente.restricao_gluten` com `produto.contem_gluten`.
  * `cliente.restricao_lactose` com `produto.contem_lactose`.
  * `cliente.restricao_acucar` com `produto.contem_acucar`.
* **Diretiva de Modelagem**: No Diagrama de Classes de Contexto, representar a validação realizada na controladora/componente da interface do usuário de pedidos, lendo os atributos booleanos de ambas as classes.


---

### Função 10: Registrar Recebimento de Sinal (50%)
* **Objetivo**: Registrar a entrada financeira de garantia (sinal mínimo de 50%) obrigatória para encomendas personalizadas.
* **Diagrama de Classes**:
  * **Classes**: `Pagamento` e `Caixa`.
  * **Atributos de `Pagamento`**: `Id: int`, `EncomendaId: int`, `CaixaId: int`, `ValorSinal: decimal`, `SaldoDevedor: decimal`, `FormaPgtoSinal: string`.
  * **Método**: `RegistrarPagamentoSinal(Pagamento)`.
* **Diagrama ER**:
  * **Tabela**: `pagamento`
  * **Colunas**: `id` (PK), `encomenda_id` (FK `encomenda` ON DELETE CASCADE), `caixa_id` (FK `caixa`), `valor_sinal` (NUMERIC), `saldo_devedor` (NUMERIC), `forma_pagamento_sinal` (VARCHAR), `status` (VARCHAR).
* **Diretiva de Modelagem**:
  * `ValorSinal` deve ser `>= 50%` do `Encomenda.ValorTotal`.
  * A tabela `pagamento` deve possuir uma FK apontando para `caixa(id)` para vincular a entrada financeira ao turno operacional da loja.

---

### Função 11: Consultar Histórico de Inadimplência por CPF
* **Objetivo**: Antes de aprovar uma nova encomenda, verificar se o cliente possui dívidas anteriores não liquidadas no sistema.
* **Diagrama de Classes**:
  * **Classes Envolvidas**: `ClienteService` ou `ClienteRepository`.
  * **Método**: `ConsultarInadimplenciaPorCpf(cpf: string): bool`.
* **Diagrama ER**: Consulta relacional.
  * Seleciona `cliente` pelo CPF.
  * Busca em `encomenda` e `pagamento` registros vinculados a este cliente cujo status do pagamento esteja como `'pendente'` ou `'atrasado'` e o `saldo_devedor > 0`.
* **Diretiva de Modelagem**: Modelar no `ClienteService` a operação de verificação, que gera uma consulta agregada no banco.

---

### Função 12: Gerar Ordem de Produção Técnica
* **Objetivo**: Exportar a ficha de fabricação para a cozinha, contendo a lista de itens da encomenda, as observações técnicas/customizações e a receita detalhada de cada produto.
* **Diagrama de Classes**:
  * **Classes Envolvidas**: `ProducaoService` ou `EncomendaService`.
  * **Método**: `ObterFichaTecnicaProducao(encomendaId: int): FichaProducaoDTO`.
* **Diagrama ER**: Não demanda nova tabela. Trata-se de uma View lógica que junta `encomenda`, `item_encomenda`, `produto` e `receita`.
* **Diretiva de Modelagem**: Representar como um método de serviço que compõe informações de múltiplas entidades para gerar um documento DTO de saída.

---

### Função 13: Visualizar Cronograma de Produção
* **Objetivo**: Exibir no painel da fábrica a lista de encomendas ativas, ordenadas cronologicamente pelo horário limite de retirada.
* **Diagrama de Classes**:
  * **Classes Envolvidas**: `EncomendaService`, `EncomendaRepository`.
  * **Método**: `ListarCronogramaProducao(): List<Encomenda>`.
* **Diagrama ER**: Consulta SQL filtrando `encomenda.status_enum` (onde status seja `0` - Pendente ou `1` - Em Andamento) ordenado por `encomenda.data_retirada` ASC.
* **Diretiva de Modelagem**: Representar como um filtro comportamental na classe de repositório da Encomenda.

---

### Função 14: Atualizar Status da Produção
* **Objetivo**: Controlar o avanço da produção na cozinha (ex: marcar um bolo que estava "Pendente" para "Em Andamento").
* **Diagrama de Classes**:
  * **Classe**: `Encomenda` (ou `EncomendaService`).
  * **Método**: `AtualizarStatus(encomendaId: int, novoStatus: StatusEnum)`.
* **Diagrama ER**:
  * **Tabela afetada**: `encomenda`
  * **Coluna atualizada**: `status_enum`.
* **Diretiva de Modelagem**: Mapeia diretamente o ciclo de transição de estados de `StatusEnum` na classe `Encomenda`.

---

### Função 15: Registrar Conclusão de Encomenda
* **Objetivo**: Concluir a fabricação. Altera o status para "Concluída" (pronta para retirada) e engatilha notificações automáticas para o cliente.
* **Diagrama de Classes**:
  * **Classes Envolvidas**: `EncomendaService`, `NotificacaoService` (Serviço externo).
  * **Método**: `ConcluirProducao(encomendaId: int)`.
* **Diagrama ER**:
  * **Tabela afetada**: `encomenda`
  * **Coluna atualizada**: `status_enum` (definida como `2` - Concluida).
* **Diretiva de Modelagem**: O método de serviço atualiza o banco e invoca a interface/classe `NotificacaoService`.

---

### Função 16: Registrar Entrega e Retirada de Pedido
* **Objetivo**: Registrar no sistema o momento exato em que o cliente veio buscar o pedido e qual funcionário realizou a entrega.
* **Diagrama de Classes**:
  * **Classes**: `Encomenda`, `Usuario` (operador da entrega).
  * **Atributos Atualizados**: `DataEntregaReal: DateTime`, `UsuarioEntregaId: int`, `Status: StatusEnum` (definido como Entregue).
  * **Método**: `RegistrarEntrega(encomendaId: int, usuarioId: int)`.
* **Diagrama ER**:
  * **Tabela**: `encomenda`
  * **Colunas Atualizadas**: `data_entrega_real` (TIMESTAMP), `usuario_entrega_id` (FK `usuario`), `status_enum` (atualizado para `4` - Entregue).
* **Diretiva de Modelagem**: Relacionamento N:1 entre `encomenda` e `usuario` específico para o papel de entregador (`usuario_entrega_id` referenciando `usuario(id)`).

---

### Função 17: Liquidar Saldo Devedor na Entrega
* **Objetivo**: Cobrar e registrar o recebimento dos 50% restantes da encomenda no ato da entrega física, zerando o débito da transação.
* **Diagrama de Classes**:
  * **Classes Envolvidas**: `Pagamento`, `Caixa`, `EncomendaService`.
  * **Atributos Modificados**: `Pagamento.SaldoDevedor` (definido como `0.00`), `Pagamento.Status` (definido como `'pago'`), `Pagamento.FormaPgtoRestante: string`.
  * **Método**: `LiquidarSaldo(encomendaId: int, formaPagamento: string, caixaId: int)`.
* **Diagrama ER**:
  * **Tabela**: `pagamento`
  * **Colunas Atualizadas**: `saldo_devedor = 0`, `status = 'pago'`, `forma_pagamento` (ex: `'Pix'`, `'Dinheiro'`).
* **Diretiva de Modelagem**: Uma restrição lógica impede a execução da entrega da encomenda (Função 16) se o status do pagamento correspondente não estiver como `'pago'`.

---

### Função 18: Abrir/Fechar Caixa de Encomendas
* **Objetivo**: Abrir o turno financeiro do dia com um valor de troco inicial e fechá-lo apurando as entradas totais recebidas de sinais e liquidações.
* **Diagrama de Classes**:
  * **Classe**: `Caixa`
  * **Atributos**: `Id: int`, `DataAbertura: DateTime`, `ValorInicial: decimal`, `Status: string` ("Aberto", "Fechado"), `DataFechamento: DateTime?`, `ValorFinal: decimal?`.
  * **Métodos**: `AbrirCaixa(valorInicial: decimal)`, `FecharCaixa(caixaId: int, valorFinal: decimal)`.
* **Diagrama ER**:
  * **Tabela**: `caixa`
  * **Colunas**: `id` (PK), `data_abertura` (TIMESTAMP), `valor_inicial` (NUMERIC), `status` (VARCHAR), `data_fechamento` (TIMESTAMP, NULLABLE), `valor_final` (NUMERIC, NULLABLE).
* **Diretiva de Modelagem**: Relacionamento 1:N entre `Caixa` e `Pagamento`. Cada pagamento financeiro efetuado no sistema obrigatoriamente vincula-se a um caixa que esteja com status `'Aberto'`.

---

### Função 19: Dashboard de Desempenho Diário
* **Objetivo**: Exibir na tela gerencial os totais faturados no dia atual, contagem de pedidos entregues, pendentes e novos clientes.
* **Diagrama de Classes**:
  * **Classes Envolvidas**: `DashboardService`, `DashboardDTO`.
  * **Método**: `ObterDadosDashboardDiario(data: DateTime): DashboardDTO`.
* **Diagrama ER**: Não há tabelas dedicadas. Lógica executada através de agregações (`SUM`, `COUNT`) e agrupamentos (`GROUP BY`) nas tabelas `pagamento` (para faturamento), `encomenda` (para quantidades por status) e `cliente` (cadastros na data).
* **Diretiva de Modelagem**: Classe de serviço com dependência em múltiplos repositórios (`EncomendaRepository`, `ClienteRepository`, `PagamentoRepository`).

---

### Função 20: Emitir Relatório Estratégico Mensal
* **Objetivo**: Compilar e exportar um relatório consolidado com o faturamento mensal, ranking de produtos mais pedidos, e clientes inadimplentes.
* **Diagrama de Classes**:
  * **Classes Envolvidas**: `RelatorioService`, `RelatorioMensalDTO`.
  * **Método**: `GerarRelatorioMensal(ano: int, mes: int): RelatorioMensalDTO`.
* **Diagrama ER**: Não requer tabelas adicionais. Utiliza queries complexas de junção (`JOIN`) e agregação temporal cruzando as tabelas `encomenda`, `item_encomenda`, `produto`, `pagamento` e `cliente`.
* **Diretiva de Modelagem**: Serviço gerador de relatórios com métodos utilitários de renderização de PDF ou planilhas. Depende da integridade histórica de preços e vínculos do banco.
