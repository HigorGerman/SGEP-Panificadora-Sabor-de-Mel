# Documentação das Estórias de Usuário Implementadas (ERS)
## Detalhamento Técnico do Backend, Banco de Dados e Interface Gráfica — SGEP

**Versão de Entrega Final — Estágio Supervisionado FIPP/Unoeste (02/2026)**  
**Aluno:** Higor Germano Cerqueira · **Orientadora:** Carolina Dias Chaves Corvetto  
**Empresa:** Panificadora e Mercado Sabor de Mel (Santo Expedito - SP)

Este documento reúne o detalhamento técnico das **20 Estórias de Usuário (F1 a F20)** da ERS, todas **100% concluídas e homologadas em produção** no sistema **SGEP**, vinculando cada requisito aos seus arquivos de código-fonte (Frontend Next.js e Backend C# .NET 10), tabelas PostgreSQL e capturas reais de tela disponíveis em [`manual/static/img/telas/`](file:///Users/germano/Documents/SGEP/manual/static/img/telas).

---

## Resumo Geral de Atendimento da ERS (20/20 Concluídas)

| ID | Estória de Usuário | Classificação | Complexidade | Situação |
| :-: | :--- | :-: | :-: | :-: |
| **F1** | Gerenciar Usuários | Básica | MÉDIA | Concluída |
| **F2** | Gerenciar Clientes (CRM) | Básica | BAIXA | Concluída |
| **F3** | Gerenciar Categorias de Produtos | Básica | BAIXA | Concluída |
| **F4** | Gerenciar Produtos | Básica | BAIXA | Concluída |
| **F5** | Gerenciar Receitas (Módulo Privado) | Básica | MÉDIA | Concluída |
| **F6** | Gerenciar Permissões de Receitas | Básica | BAIXA | Concluída |
| **F7** | Efetuar Encomenda Personalizada | Fundamental | ALTA | Concluída |
| **F8** | Vincular Especificações Técnicas ao Pedido | Fundamental | MÉDIA | Concluída |
| **F9** | Validar Alertas de Segurança Alimentar | Fundamental | MÉDIA | Concluída |
| **F10** | Registrar Recebimento de Sinal / Pagamento | Fundamental | MÉDIA | Concluída |
| **F11** | Consultar Histórico de Inadimplência por CPF | Fundamental | MÉDIA | Concluída |
| **F12** | Gerar Ordem de Produção Técnica | Fundamental | BAIXA | Concluída |
| **F13** | Visualizar Cronograma de Produção | Fundamental | MÉDIA | Concluída |
| **F14** | Atualizar Status da Produção | Fundamental | BAIXA | Concluída |
| **F15** | Registrar Conclusão de Encomenda | Fundamental | BAIXA | Concluída |
| **F16** | Registrar Entrega e Retirada de Pedido | Fundamental | BAIXA | Concluída |
| **F17** | Liquidar Saldo Devedor na Entrega | Fundamental | MÉDIA | Concluída |
| **F18** | Recuperar Senha e Validar Operações de Conta com Token por E-mail | Fundamental | MÉDIA | Concluída |
| **F19** | Dashboard de Desempenho Diário | Saída | MÉDIA | Concluída |
| **F20** | Emitir Relatório Estratégico Mensal | Saída | ALTA | Concluída |

---

## 1. Gerenciar Usuários (F1)
* **Objetivo**: Cadastro, listagem, busca, alteração e inativação lógica de operadores internos (Administradores e Funcionários).
* **Frontend**: [`usuarios/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/usuarios/page.tsx) — Captura: [`18-usuarios.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/18-usuarios.png)
* **Backend**: [`UsuariosController.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/UsuariosController.cs) → [`UsuarioServices.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/UsuarioServices.cs) → [`UsuarioRepository.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/UsuarioRepository.cs)
  * Senhas criptografadas com `BCrypt.Net.BCrypt.HashPassword`.
  * Exclusão lógica (`excluido = true`) caso existam encomendas vinculadas ao operador, preservando auditoria.
* **Banco de Dados**: Tabela `usuario` (`id`, `usuario_nome`, `email`, `senha`, `perfil_enum`, `excluido`).

---

## 2. Gerenciar Clientes / CRM (F2)
* **Objetivo**: Cadastro e manutenção de clientes com CPF único, telefone, e-mail e preferências de restrições alimentares (Glúten, Lactose e Açúcar).
* **Frontend**: [`registro/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/registro/page.tsx) e [`perfil/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/perfil/page.tsx) — Capturas: [`03-registro.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/03-registro.png) e [`08-perfil.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/08-perfil.png)
* **Backend**: [`ClienteController.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/ClienteController.cs) → [`ClienteService.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/ClienteService.cs) → [`ClienteRepository.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/ClienteRepository.cs)
* **Banco de Dados**: Tabela `cliente` (`id`, `nome`, `cpf`, `email`, `senha`, `telefone`, `restricao_gluten`, `restricao_lactose`, `restricao_acucar`, `ativo`, `bloqueado_encomendas`, `motivo_bloqueio`).

---

## 3. Gerenciar Categorias de Produtos (F3)
* **Objetivo**: Classificar o catálogo em grupos lógicos de produtos, aplicando inativação lógica quando já houver itens associados.
* **Frontend**: [`categorias/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/categorias/page.tsx) — Captura: [`16-categorias.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/16-categorias.png)
* **Backend**: [`CategoriasController.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/CategoriasController.cs) → [`CategoriaService.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/CategoriaService.cs) → [`CategoriaRepository.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/CategoriaRepository.cs)
* **Banco de Dados**: Tabela `categoria` (`id`, `descricao`, `inativo`).

---

## 4. Gerenciar Produtos (F4)
* **Objetivo**: Cadastrar produtos do cardápio com foto (`ImagemUrl`), preço unitário, categoria, flags de alérgenos e template `JSONB` de campos de personalização.
* **Frontend**: [`produtos/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/produtos/page.tsx) e [`catalogo/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/catalogo/page.tsx) — Capturas: [`17-produtos.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/17-produtos.png) e [`05-catalogo.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/05-catalogo.png)
* **Backend**: [`ProdutoController.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/ProdutoController.cs) → [`ProdutoService.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/ProdutoService.cs) → [`ProdutoRepository.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/ProdutoRepository.cs)
* **Banco de Dados**: Tabela `produto` (`id`, `nome`, `preco_unitario`, `categoria_id`, `imagem_url`, `descricao`, `permite_customizacao`, `template_customizacao`, `contem_gluten`, `contem_lactose`, `contem_acucar`).

---

## 5. Gerenciar Receitas — Módulo Privado (F5)
* **Objetivo**: Cadastrar e consultar fichas técnicas confidenciais (ingredientes, modo de preparo e rendimento) vinculadas aos produtos da panificadora.
* **Frontend**: [`receitas/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/receitas/page.tsx) — Captura: [`12-receitas.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/12-receitas.png)
* **Backend**: `ProdutosController` (`GET /Produtos/com-receitas` e `PUT /Produtos/{id}/receita`) → [`ReceitaRepository.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/ReceitaRepository.cs) (*upsert* automático por `produto_id`).
* **Banco de Dados**: Tabela `receita` (`id`, `produto_id` UNIQUE FK, `ingredientes`, `modo_preparo`, `rendimento`).

---

## 6. Gerenciar Permissões de Receitas (F6)
* **Objetivo**: Proteger o segredo industrial garantindo que apenas operadores internos autenticados acessem o módulo de receitas, restringindo edições cadastrais ao perfil Administrador (`0`).
* **Frontend**: Controle de visibilidade e permissão em [`sidebar.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/components/sidebar.tsx), [`receitas/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/receitas/page.tsx) e [`produtos/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/produtos/page.tsx).
* **Backend**: Emissão de `ClaimTypes.Role` em [`TokenService.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/TokenService.cs) e validação JWT em [`Program.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Program.cs) com base em `usuario.perfil_enum`.

---

## 7. Efetuar Encomenda Personalizada (F7)
* **Objetivo**: Registrar encomendas vinculadas ao cliente, validando antecedência mínima de 24h, janela comercial (Seg–Sáb, 08h–18h) e cálculo seguro do total no backend com transação SQL explícita.
* **Frontend**: [`nova-encomenda/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/nova-encomenda/page.tsx) e acompanhamento em [`minhas-encomendas/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/minhas-encomendas/page.tsx) — Capturas: [`06-nova-encomenda.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/06-nova-encomenda.png) e [`07-minhas-encomendas.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/07-minhas-encomendas.png)
* **Backend**: [`EncomendaController.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/EncomendaController.cs) → [`EncomendaService.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/EncomendaService.cs) → [`EncomendaRepository.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/EncomendaRepository.cs) (`BeginTransaction` / `Commit` / `Rollback`).
* **Banco de Dados**: Tabelas `encomenda` e `item_encomenda`.

---

## 8. Vincular Especificações Técnicas ao Pedido (F8)
* **Objetivo**: Capturar e gravar as personalizações individuais de cada item da encomenda (ex.: massa, recheio, tema, frase de topo e observação do item).
* **Frontend**: Modal dinâmico `customModalOpen` em [`nova-encomenda/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/nova-encomenda/page.tsx) renderizado a partir de `produto.templateCustomizacao`.
* **Backend / Banco de Dados**: Persistido em formato estruturado `JSONB` na coluna `item_encomenda.especificacoes_tecnicas`.

---

## 9. Validar Alertas de Segurança Alimentar (F9)
* **Objetivo**: Emitir aviso crítico automático ao adicionar um produto que contenha Glúten, Lactose ou Açúcar incompatível com as restrições ativas no perfil do cliente.
* **Frontend**: Banner preventivo de saúde + modal de confirmação `healthAlertModalOpen` em [`nova-encomenda/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/nova-encomenda/page.tsx).
* **Banco de Dados**: Cruzamento das flags booleanas `cliente.restricao_*` com `produto.contem_*`.

---

## 10. Registrar Recebimento de Sinal / Pagamento (F10)
* **Objetivo**: Integrar o pagamento online das encomendas via **Mercado Pago Checkout Pro** (Pix, Cartão de Crédito/Débito, integral ou sinal) ou registrar compromisso de pagamento presencial no balcão.
* **Frontend**: Seletor de pagamento e redirecionamento Checkout Pro em [`nova-encomenda/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/nova-encomenda/page.tsx) e confirmação automática de retorno em [`minhas-encomendas/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/minhas-encomendas/page.tsx).
* **Backend**: [`PagamentosController.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/PagamentosController.cs) (`gerar-preferencia`, `webhook`, `confirmar-retorno`, `registrar-presencial`) → [`PagamentoService.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/PagamentoService.cs) → [`PagamentoRepository.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/PagamentoRepository.cs).
* **Banco de Dados**: Tabela `pagamento` (`valor_total`, `valor_sinal`, `saldo_devedor`, `status`, `forma_pagamento`, `preference_id`, `mp_payment_id`).

---

## 11. Consultar Histórico de Inadimplência por CPF (F11)
* **Objetivo**: Consultar pendências financeiras anteriores por CPF/ID antes de aprovar novos pedidos (alertando com 1 pendência e bloqueando a partir de 2 pendências ou bloqueio manual) e oferecer painel administrativo com disparo de aviso de cobrança por e-mail.
* **Frontend**: [`admin/inadimplencia/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/admin/inadimplencia/page.tsx) e validação em `/nova-encomenda` — Captura: [`15-inadimplencia.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/15-inadimplencia.png)
* **Backend**: [`AdminInadimplenciaController.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/AdminInadimplenciaController.cs) → `ClienteServices` → `ClienteRepository.ObterSituacaoFinanceiraCliente` / `ListarInadimplentes` + [`EmailService.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/EmailService.cs).

---

## 12. Gerar Ordem de Produção Técnica (F12)
* **Objetivo**: Exibir e imprimir os detalhes técnicos completos da encomenda para a cozinha (cliente, horário de retirada, itens, quantidades e especificações técnicas personalizadas em destaque).
* **Frontend**: Cards detalhados e visualização técnica em [`producao/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/producao/page.tsx) — Captura: [`09-producao.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/09-producao.png)
* **Backend**: `EncomendaController.ListarComDetalhes` (`GET /api/Encomenda/detalhes`) consolidando `encomenda`, `cliente`, `item_encomenda` e `produto`.

---

## 13. Visualizar Cronograma de Produção (F13)
* **Objetivo**: Organizar cronologicamente todas as encomendas por horário de retirada e fase operacional para priorização da fabricação sem atrasos.
* **Frontend**: [`producao/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/producao/page.tsx) e [`historico/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/historico/page.tsx) — Capturas: [`09-producao.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/09-producao.png) e [`13-historico.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/13-historico.png)
* **Backend**: Ordenação `ORDER BY e.data_retirada ASC` em [`EncomendaRepository.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/EncomendaRepository.cs).

---

## 14. Atualizar Status da Produção (F14)
* **Objetivo**: Avançar a fase produtiva da encomenda na cozinha (*Pendente* → *Em Produção*), dando visibilidade em tempo real à equipe e ao cliente.
* **Frontend**: [`producao/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/producao/page.tsx)
* **Backend**: `PATCH /api/Encomenda/{id}/status` em [`EncomendaController.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/EncomendaController.cs).

---

## 15. Registrar Conclusão de Encomenda (F15)
* **Objetivo**: Finalizar a etapa de fabricação marcando o pedido como *Concluído / Pronto para Retirada* (`status_enum = 2`), liberando-o automaticamente para conferência e entrega no balcão.
* **Frontend**: Botão de conclusão em [`producao/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/producao/page.tsx) e listagem imediata em [`retirada/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/retirada/page.tsx).
* **Backend**: `EncomendaRepository.AtualizarStatus(id, Encomenda.StatusEnum.Concluida)`.

---

## 16. Registrar Entrega e Retirada de Pedido (F16)
* **Objetivo**: Confirmar a entrega física da encomenda ao cliente no balcão, exigindo pagamento quitado e auditando data/hora real e funcionário responsável.
* **Frontend**: [`retirada/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/retirada/page.tsx) — Captura: [`10-retirada.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/10-retirada.png)
* **Backend**: `POST /api/Encomenda/{id}/entrega` → `EncomendaRepository.RegistrarEntrega` (atualiza `status_enum = 4`, `data_entrega_real` e `usuario_entrega_id`).

---

## 17. Liquidar Saldo Devedor na Entrega (F17)
* **Objetivo**: Receber e liquidar no caixa do balcão as encomendas agendadas para pagamento presencial ou com saldo devedor aberto, registrando a forma de pagamento efetiva (*Dinheiro*, *Pix*, *Cartão*).
* **Frontend**: [`admin/cobranca/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/admin/cobranca/page.tsx) — Captura: [`11-cobranca.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/11-cobranca.png)
* **Backend**: `GET /api/pagamentos/pendentes` e `POST /api/pagamentos/liquidar` em [`PagamentosController.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/PagamentosController.cs) → `PagamentoRepository.LiquidarSaldo`.

---

## 18. Recuperar Senha e Validar Operações de Conta com Token por E-mail (F18)
* **Objetivo**: Validar operações críticas de conta mediante código numérico aleatório de 6 dígitos enviado por e-mail (validade de 15 minutos e invalidação automática de tokens anteriores) para:
  1. **Recuperação de Senha** na tela de login (`/login`) para Clientes e Administradores/Funcionários.
  2. **Alteração de Dados de Perfil e Troca de Senha** na tela `/perfil`.
  3. **Exclusão Lógica de Conta (LGPD / Soft Delete)** na Zona de Perigo de `/perfil`.
* **Frontend**: Modais de token em [`login/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/login/page.tsx) e [`perfil/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/perfil/page.tsx) — Capturas: [`04-recuperar-senha.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/04-recuperar-senha.png) e [`08-perfil.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/08-perfil.png)
* **Backend**: [`ClienteController.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/ClienteController.cs) → [`ClienteService.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/ClienteService.cs) → [`TokenAutenticacaoRepository.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Repository/TokenAutenticacaoRepository.cs) + [`EmailService.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Service/EmailService.cs) (API HTTPS Resend / SMTP MailKit).
* **Banco de Dados**: Tabela `token_autenticacao` (`id`, `cliente_id`, `codigo_token`, `tipo_token`, `data_expiracao`, `utilizado`, `data_criacao`).

---

## 19. Dashboard de Desempenho Diário (F19)
* **Objetivo**: Exibir visão gerencial instantânea com os KPIs financeiros e operacionais do dia (Faturamento Confirmado, Saldo Pendente a Receber, Total de Encomendas e Ticket Médio).
* **Frontend**: [`admin/dashboard/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/admin/dashboard/page.tsx) — Captura: [`14-dashboard.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/14-dashboard.png)
* **Backend**: `GET /api/pagamentos/dashboard` → [`DashboardResponseDTO.cs`](file:///Users/germano/Documents/SGEP/BackEnd/BackEnd/Controllers/DTOS/DashboardResponseDTO.cs) → `PagamentoRepository.ObterDadosDashboard`.

---

## 20. Emitir Relatório Estratégico Mensal (F20)
* **Objetivo**: Consolidar estatísticas gerenciais por período selecionável (início e fim / fechamento mensal), incluindo ranking de produtos mais vendidos, faturamento detalhado por meio de pagamento (*Mercado Pago*, *Pix*, *Cartão*, *Dinheiro*), gráfico de evolução diária e suporte a exportação/impressão.
* **Frontend**: Filtros de período, gráficos analíticos e tabela de ranking em [`admin/dashboard/page.tsx`](file:///Users/germano/Documents/SGEP/frontend/src/app/admin/dashboard/page.tsx) — Captura: [`14-dashboard.png`](file:///Users/germano/Documents/SGEP/manual/static/img/telas/14-dashboard.png)
* **Backend**: Queries agregadas em `PagamentoRepository.ObterDadosDashboard(DateTime? dataInicio, DateTime? dataFim)` retornando `ProdutosMaisVendidos`, `PagamentosPorForma` e `EvolucaoFaturamento`.
