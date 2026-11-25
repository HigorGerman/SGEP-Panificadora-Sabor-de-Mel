# Especificação de Modelagem e Arquitetura das 20 Funções da ERS
## Guia Consolidado de Classes, Serviços, Endpoints e Banco de Dados — SGEP

**Versão de Entrega Final — Estágio Supervisionado FIPP/Unoeste (02/2026)**  
**Aluno:** Higor Germano Cerqueira · **Orientadora:** Carolina Dias Chaves Corvetto  
**Empresa:** Panificadora e Mercado Sabor de Mel (Santo Expedito - SP)

Este documento consolida a modelagem arquitetural completa das **20 Estórias de Usuário (Funções F1 a F20)** especificadas na ERS e integralmente implementadas no **SGEP (Sistema de Gestão de Encomendas e Fluxo de Produção)**, servindo de referência direta para o **Diagrama de Classes** e o **Diagrama Entidade-Relacionamento (DER)**.

---

## 1. Mapeamento Geral de Entidades e Tabelas Core

1. **`Usuario`** (`usuario`): Administradores (`0`) e Funcionários (`1`) da panificadora.
2. **`Cliente`** (`cliente`): Cadastro CRM com CPF, contato, restrições alimentares (Glúten, Lactose, Açúcar) e controle de bloqueio por inadimplência.
3. **`TokenAutenticacao`** (`token_autenticacao`): Tokens numéricos de 6 dígitos com expiração de 15 minutos para recuperação de senha, alteração de perfil e exclusão de conta por e-mail.
4. **`Categoria`** (`categoria`): Agrupamento lógico do catálogo de produtos.
5. **`Produto`** (`produto`): Itens comercializados com foto, preço, flags de alérgenos e template `JSONB` de customização.
6. **`Receita`** (`receita`): Ficha técnica confidencial de fabricação própria (`1:1` com `Produto`).
7. **`Encomenda`** (`encomenda`): Cabeçalho do pedido agendado, status produtivo e auditoria de retirada.
8. **`ItemEncomenda`** (`item_encomenda`): Itens do pedido com `preco_no_ato` e `especificacoes_tecnicas` (`JSONB`).
9. **`Pagamento`** (`pagamento`): Gestão financeira integrada ao **Mercado Pago Checkout Pro** e à cobrança presencial no **Balcão** (com tabela auxiliar `caixa` para FK opcional).

---

## 2. Detalhamento Arquitetural das 20 Funções (100% Concluídas)

### Função 1: Gerenciar Usuários
* **Classificação / Complexidade / Situação**: Básica · MÉDIA · **Concluída**
* **Objetivo**: Cadastrar, listar, buscar, editar e inativar administradores e funcionários internos, protegendo senhas com hash `BCrypt` e preservando histórico de auditoria.
* **Arquitetura e Classes**:
  * **Entidade**: `Usuario` (`Id`, `UsuarioNome`, `Email`, `Senha`, `Perfil: PerfilEnum`, `Excluido`).
  * **Backend**: `UsuariosController` → `UsuarioServices` → `UsuarioRepository` (`Criar`, `Listar`, `Alterar`, `Excluir`, `ObterPorEmailESenha`, `ObterPorEmail`, `AtualizarSenha`).
  * **Frontend**: `/usuarios` ([`usuarios/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/usuarios/page.tsx)).
* **Banco de Dados (`usuario`)**: Exclusão lógica (`excluido = TRUE`) quando o colaborador possui encomendas vinculadas.

---

### Função 2: Gerenciar Clientes (CRM)
* **Classificação / Complexidade / Situação**: Básica · BAIXA · **Concluída**
* **Objetivo**: Gerenciar o cadastro de clientes com validação de CPF/e-mail únicos e mapeamento obrigatório de restrições alimentares (Glúten, Lactose e Açúcar).
* **Arquitetura e Classes**:
  * **Entidade**: `Cliente` (`Id`, `Nome`, `Cpf`, `Email`, `Senha`, `Telefone`, `RestricaoGluten`, `RestricaoLactose`, `RestricaoAcucar`, `Ativo`, `BloqueadoEncomendas`, `MotivoBloqueio`).
  * **Backend**: `ClientesController` → `ClienteServices` → `ClienteRepository`.
  * **Frontend**: `/registro` ([`registro/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/registro/page.tsx)) e `/perfil` ([`perfil/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/perfil/page.tsx)).
* **Banco de Dados (`cliente`)**: Relacionamento `1:N` com `encomenda`; desativação lógica (`ativo = FALSE`) preservando histórico fiscal e financeiro.

---

### Função 3: Gerenciar Categorias de Produtos
* **Classificação / Complexidade / Situação**: Básica · BAIXA · **Concluída**
* **Objetivo**: Organizar o cardápio de encomendas em categorias (ex.: *Pães*, *Bolos de Festa*, *Salgados*, *Doces*).
* **Arquitetura e Classes**:
  * **Entidade**: `Categoria` (`Id`, `Descricao`, `Inativo`).
  * **Backend**: `CategoriasController` → `CategoriaService` → `CategoriaRepository`.
  * **Frontend**: `/categorias` ([`categorias/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/categorias/page.tsx)).
* **Banco de Dados (`categoria`)**: Relacionamento `1:N` com `produto`. Caso possua produtos atrelados, a exclusão converte-se automaticamente em inativação lógica (`inativo = TRUE`).

---

### Função 4: Gerenciar Produtos
* **Classificação / Complexidade / Situação**: Básica · BAIXA · **Concluída**
* **Objetivo**: Cadastrar e manter os itens do catálogo com foto (`ImagemUrl`), preço unitário, categoria, composição alergênica e configuração de campos personalizáveis.
* **Arquitetura e Classes**:
  * **Entidade**: `Produto` (`Id`, `Nome`, `PrecoUnitario`, `CategoriaId`, `ImagemUrl`, `Descricao`, `PermiteCustomizacao`, `TemplateCustomizacao`, `ContemGluten`, `ContemLactose`, `ContemAcucar`).
  * **Backend**: `ProdutosController` → `ProdutoServices` → `ProdutoRepository`.
  * **Frontend**: `/produtos` ([`produtos/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/produtos/page.tsx)) e vitrine pública `/catalogo` ([`catalogo/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/catalogo/page.tsx)).
* **Banco de Dados (`produto`)**: Persistência de `template_customizacao` em `JSONB` e proteção de integridade referencial (`SQLSTATE 23503`) caso o item já conste em encomendas.

---

### Função 5: Gerenciar Receitas (Módulo Privado)
* **Classificação / Complexidade / Situação**: Básica · MÉDIA · **Concluída**
* **Objetivo**: Proteger o segredo industrial da panificadora armazenando ingredientes, modo de preparo e rendimento vinculados a cada produto, além de permitir impressão limpa para a cozinha.
* **Arquitetura e Classes**:
  * **Entidade**: `Receita` (`Id`, `ProdutoId`, `Ingredientes`, `ModoPreparo`, `Rendimento`).
  * **Backend**: `ProdutosController` (`GET /Produtos/com-receitas`, `PUT /Produtos/{id}/receita`) → `ProdutoServices` → `ReceitaRepository` (`Salvar` com *upsert*).
  * **Frontend**: `/receitas` ([`receitas/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/receitas/page.tsx)).
* **Banco de Dados (`receita`)**: Relacionamento `1:1` estrito com `produto` (`produto_id UNIQUE REFERENCES produto(id) ON DELETE CASCADE`).

---

### Função 6: Gerenciar Permissões de Receitas
* **Classificação / Complexidade / Situação**: Básica · BAIXA · **Concluída**
* **Objetivo**: Restringir a visualização e a edição das fichas técnicas de receitas conforme o perfil autenticado (`PerfilEnum` e token JWT), ocultando dados industriais de clientes externos e restringindo edições.
* **Arquitetura e Classes**:
  * **Classes Envolvidas**: `Usuario` (`PerfilEnum`: `0 = Admin`, `1 = Funcionario`), `TokenService` (claims `ClaimTypes.Role` no JWT), `Sidebar` e `ReceitasPage`.
* **Diretiva de Modelagem**: Controle comportamental baseado em `usuario.perfil_enum` e validação de sessão JWT (`Bearer` / Cookie `HttpOnly`), exibindo o módulo apenas para operadores internos autorizados e reservando alterações cadastrais ao Administrador.

---

### Função 7: Efetuar Encomenda Personalizada
* **Classificação / Complexidade / Situação**: Fundamental · ALTA · **Concluída**
* **Objetivo**: Lançar encomendas vinculadas ao cliente, validando antecedência mínima de 24h, horário comercial de retirada (Seg–Sáb, 08h–18h) e recalculando preços no servidor com transação atômica.
* **Arquitetura e Classes**:
  * **Entidades**: `Encomenda` e `ItemEncomenda`.
  * **Backend**: `EncomendaController` (`POST /api/Encomenda`) → `EncomendaServices` → `EncomendaRepository` (transação `BeginTransaction` / `Commit` / `Rollback`).
  * **Frontend**: `/nova-encomenda` ([`nova-encomenda/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/nova-encomenda/page.tsx)).
* **Banco de Dados (`encomenda` + `item_encomenda`)**: Composição forte `1:N` com gravação do `preco_no_ato` para integridade histórica.

---

### Função 8: Vincular Especificações Técnicas ao Pedido
* **Classificação / Complexidade / Situação**: Fundamental · MÉDIA · **Concluída**
* **Objetivo**: Registrar e editar customizações específicas por item do pedido (massa, recheio, tema, frase escrita no bolo e observações individuais) a partir do template configurado no produto.
* **Arquitetura e Classes**:
  * **Entidade**: `ItemEncomenda` (`EspecificacoesTecnicas: string` serializado em JSON).
  * **Frontend**: Modal dinâmico de personalização em [`nova-encomenda/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/nova-encomenda/page.tsx) gerado a partir de `produto.templateCustomizacao`.
* **Banco de Dados (`item_encomenda.especificacoes_tecnicas`)**: Coluna nativa `JSONB` no PostgreSQL.

---

### Função 9: Validar Alertas de Segurança Alimentar
* **Classificação / Complexidade / Situação**: Fundamental · MÉDIA · **Concluída**
* **Objetivo**: Emitir alertas preventivos automáticos sempre que um cliente com restrição a Glúten, Lactose ou Açúcar selecionar um produto que contenha tais ingredientes, exigindo ciência explícita antes de adicionar ao pedido.
* **Arquitetura e Classes**:
  * ** Modelos Cruzados**: `Cliente` (`RestricaoGluten`, `RestricaoLactose`, `RestricaoAcucar`) × `Produto` (`ContemGluten`, `ContemLactose`, `ContemAcucar`).
  * **Frontend**: Banner de perfil ativo + modal crítico `healthAlertModalOpen` em [`nova-encomenda/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/nova-encomenda/page.tsx).

---

### Função 10: Registrar Recebimento de Sinal / Pagamento da Encomenda
* **Classificação / Complexidade / Situação**: Fundamental · MÉDIA · **Concluída**
* **Objetivo**: Registrar o compromisso financeiro da encomenda no ato do pedido, suportando pagamento online via **Mercado Pago Checkout Pro** (Pix, Cartão de Crédito/Débito, integral ou sinal de 50%) ou agendamento de pagamento presencial no balcão.
* **Arquitetura e Classes**:
  * **Entidade**: `Pagamento` (`Id`, `EncomendaId`, `ValorTotal`, `ValorSinal`, `SaldoDevedor`, `FormaPgtoSinal`, `FormaPagamento`, `Status`, `PreferenceId`, `MpPaymentId`).
  * **Backend**: `PagamentosController` (`POST /api/pagamentos/gerar-preferencia`, `POST /api/pagamentos/webhook`, `POST /api/pagamentos/confirmar-retorno`, `POST /api/pagamentos/registrar-presencial`) → `PagamentoService` (`CalcularSinal`, `GerarPreferenciaAsync`, `ConfirmarRetornoMercadoPagoAsync`, `RegistrarPagamentoPresencial`) → `PagamentoRepository`.
* **Banco de Dados (`pagamento`)**: Relacionamento `1:1` com `encomenda`, armazenando `preference_id`, `mp_payment_id` e saldo a receber.

---

### Função 11: Consultar Histórico de Inadimplência por CPF
* **Classificação / Complexidade / Situação**: Fundamental · MÉDIA · **Concluída**
* **Objetivo**: Verificar automaticamente pendências financeiras anteriores por CPF/ID antes de aprovar novos pedidos online (emitindo aviso com 1 pendência e bloqueando a partir de 2 pendências ou bloqueio administrativo) e disponibilizar painel gerencial de cobrança por e-mail.
* **Arquitetura e Classes**:
  * **Backend**: `AdminInadimplenciaController` (`GET /api/admin/inadimplencia`, `GET /api/clientes/verificar-cpf/{cpf}`, `GET /api/clientes/{id}/verificar-situacao`, `PATCH /api/admin/clientes/{id}/bloqueio`, `POST /api/admin/clientes/{id}/notificar-cobranca`) → `ClienteServices` → `ClienteRepository` (`ObterSituacaoFinanceiraCliente`, `ListarInadimplentes`, `AtualizarBloqueio`) + `EmailService` (`EnviarNotificacaoInadimplenciaAsync`).
  * **Frontend**: Painel `/admin/inadimplencia` ([`admin/inadimplencia/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/admin/inadimplencia/page.tsx)) e trava automática no carrinho em `/nova-encomenda`.

---

### Função 12: Gerar Ordem de Produção Técnica
* **Classificação / Complexidade / Situação**: Fundamental · BAIXA · **Concluída**
* **Objetivo**: Consolidar para a equipe de fabricação os dados técnicos do pedido (`#ID`, cliente, horário de retirada, itens, especificações personalizadas em destaque e observações, sem expor dados financeiros sensíveis) com suporte a visualização detalhada e impressão para a cozinha.
* **Arquitetura e Classes**:
  * **Backend**: `EncomendaController` (`GET /api/Encomenda/detalhes` e `GET /api/Encomenda/{id}`) → `EncomendaServices` → `EncomendaRepository` (JOIN entre `encomenda`, `cliente`, `item_encomenda` e `produto`).
  * **Frontend**: Visualização e emissão de ficha de produção em [`producao/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/producao/page.tsx) e consulta técnica em [`receitas/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/receitas/page.tsx).

---

### Função 13: Visualizar Cronograma de Produção
* **Classificação / Complexidade / Situação**: Fundamental · MÉDIA · **Concluída**
* **Objetivo**: Exibir em tempo real a fila de encomendas organizada cronologicamente pela data/horário de retirada e filtrada por fase produtiva, destacando pedidos urgentes do dia.
* **Arquitetura e Classes**:
  * **Backend**: `EncomendaRepository.ListarComDetalhes()` ordenado por `data_retirada ASC`.
  * **Frontend**: Painel `/producao` ([`producao/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/producao/page.tsx)) e visão completa em `/historico` ([`historico/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/historico/page.tsx)).

---

### Função 14: Atualizar Status da Produção
* **Classificação / Complexidade / Situação**: Fundamental · BAIXA · **Concluída**
* **Objetivo**: Permitir que confeiteiros e padeiros avancem o estado de preparo da encomenda (`Pendente` → `Em Andamento`), refletindo o progresso instantaneamente na área *Minhas Encomendas* do cliente.
* **Arquitetura e Classes**:
  * **Backend**: `EncomendaController.AtualizarStatus` (`PATCH /api/Encomenda/{id}/status`) → `EncomendaServices` → `EncomendaRepository.AtualizarStatus`.
  * **Frontend**: Ação direta nos cards de `/producao` ([`producao/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/producao/page.tsx)).

---

### Função 15: Registrar Conclusão de Encomenda
* **Classificação / Complexidade / Situação**: Fundamental · BAIXA · **Concluída**
* **Objetivo**: Marcar a fabricação do pedido como finalizada (`StatusEnum.Concluida = 2` — *Pronto para Retirada*), disponibilizando-o imediatamente na fila de entrega do balcão (`/retirada`) e atualizando a linha do tempo do cliente.
* **Arquitetura e Classes**:
  * **Backend**: `EncomendaController.AtualizarStatus` (`status = 2`) → `EncomendaServices` → `EncomendaRepository`.
  * **Frontend**: Aba *Prontas / Concluídas* em `/producao` e habilitação automática em `/retirada`.

---

### Função 16: Registrar Entrega e Retirada de Pedido
* **Classificação / Complexidade / Situação**: Fundamental · BAIXA · **Concluída**
* **Objetivo**: Confirmar a retirada física da encomenda pelo cliente no balcão, validando previamente a quitação financeira e gravando o horário exato (`data_entrega_real`) e o colaborador responsável (`usuario_entrega_id`).
* **Arquitetura e Classes**:
  * **Backend**: `EncomendaController.RegistrarEntrega` (`POST /api/Encomenda/{id}/entrega`) → `EncomendaServices` → `EncomendaRepository.RegistrarEntrega`.
  * **Frontend**: `/retirada` ([`retirada/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/retirada/page.tsx)).
* **Banco de Dados (`encomenda`)**: Atualiza `status_enum = 4` (*Entregue*), `data_entrega_real` e `usuario_entrega_id`.

---

### Função 17: Liquidar Saldo Devedor na Entrega
* **Classificação / Complexidade / Situação**: Fundamental · MÉDIA · **Concluída**
* **Objetivo**: Dar baixa financeira no balcão das encomendas com pagamento presencial ou saldo restante, permitindo escolher a forma de pagamento (*Dinheiro*, *Pix*, *Cartão de Crédito/Débito*), zerando `saldo_devedor` e liberando a entrega.
* **Arquitetura e Classes**:
  * **Backend**: `PagamentosController` (`GET /api/pagamentos/pendentes` e `POST /api/pagamentos/liquidar`) → `PagamentoService.LiquidarSaldo` → `PagamentoRepository.LiquidarSaldo`.
  * **Frontend**: `/admin/cobranca` ([`admin/cobranca/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/admin/cobranca/page.tsx)).

---

### Função 18: Recuperar Senha e Validar Operações de Conta com Token por E-mail
* **Classificação / Complexidade / Situação**: Fundamental · MÉDIA · **Concluída**
* **Objetivo**: Garantir segurança de autenticação em duas etapas por e-mail através de códigos numéricos temporários de 6 dígitos (expiração de 15 minutos e invalidação automática de códigos anteriores) para três fluxos críticos: **Recuperação de Senha**, **Alteração de Perfil/Senha** e **Exclusão Lógica de Conta (LGPD)**.
* **Arquitetura e Classes**:
  * **Entidade**: `TokenAutenticacao` (`Id`, `ClienteId`, `CodigoToken`, `TipoToken`, `DataExpiracao`, `Utilizado`, `DataCriacao`).
  * **Backend**: `ClientesController` (`POST /Clientes/solicitar-recuperacao-senha`, `POST /Clientes/redefinir-senha`, `POST /Clientes/solicitar-codigo-alteracao`, `PUT /Clientes/perfil-com-codigo`, `POST /Clientes/solicitar-exclusao-conta`, `POST /Clientes/confirmar-exclusao-conta`) → `ClienteServices` → `TokenAutenticacaoRepository` + `EmailService` (envio HTML via API HTTPS **Resend** / **MailKit**).
  * **Frontend**: Modais de verificação de 6 dígitos em `/login` ([`login/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/login/page.tsx)) e `/perfil` ([`perfil/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/perfil/page.tsx)).
* **Banco de Dados (`token_autenticacao`)**: Suporta tanto clientes (`cliente_id > 0`) quanto operadores internos (`cliente_id < 0` na recuperação de senha).

---

### Função 19: Dashboard de Desempenho Diário
* **Classificação / Complexidade / Situação**: Saída · MÉDIA · **Concluída**
* **Objetivo**: Apresentar em tempo real os indicadores operacionais e financeiros do dia (Faturamento Confirmado, Saldo Pendente a Receber, Total de Encomendas e Ticket Médio), permitindo acompanhamento imediato pela gerência.
* **Arquitetura e Classes**:
  * **DTOs**: `DashboardResponseDTO`, `PagamentoFormaDTO`, `EvolucaoDiaDTO`.
  * **Backend**: `PagamentosController.ObterDashboard` (`GET /api/pagamentos/dashboard`) → `PagamentoService.ObterDadosDashboard` → `PagamentoRepository.ObterDadosDashboard`.
  * **Frontend**: `/admin/dashboard` ([`admin/dashboard/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/admin/dashboard/page.tsx)).

---

### Função 20: Emitir Relatório Estratégico Mensal
* **Classificação / Complexidade / Situação**: Saída · ALTA · **Concluída**
* **Objetivo**: Processar e consolidar estatísticas estratégicas por período customizável (`dataInicio` e `dataFim` / visão mensal), exibindo faturamento por modalidade (*Dinheiro*, *Cartão*, *Pix*, *Mercado Pago*), evolução diária de receita, ranking dos produtos mais vendidos e exportação/impressão gerencial.
* **Arquitetura e Classes**:
  * **DTOs**: `DashboardResponseDTO` (`ProdutosMaisVendidos: List<ProdutoMaisVendidoDTO>`, `PagamentosPorForma: List<PagamentoFormaDTO>`, `EvolucaoFaturamento: List<EvolucaoDiaDTO>`).
  * **Backend**: Consultas SQL analíticas agregadas (`SUM`, `COUNT`, `GROUP BY`) cruzando `encomenda`, `item_encomenda`, `produto` e `pagamento` em `PagamentoRepository.ObterDadosDashboard(dataInicio, dataFim)`.
  * **Frontend**: Filtros de período, gráficos comparativos, tabelas de ranking e impressão de relatório em [`admin/dashboard/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/admin/dashboard/page.tsx).
