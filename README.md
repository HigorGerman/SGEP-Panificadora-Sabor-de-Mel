# SGEP - Sistema de Gestão de Encomendas e Fluxo de Produção
### Panificadora e Mercado Sabor de Mel · Santo Expedito/SP

✅ **Status: Concluído — Versão de Entrega Final (Estágio Supervisionado FIPP/Unoeste · 02/2026)**

| | |
| :--- | :--- |
| **Aluno** | Higor Germano Cerqueira |
| **Orientadora** | Carolina Dias Chaves Corvetto |
| **Instituição** | Universidade do Oeste Paulista (Unoeste) · FIPP |
| **Empresa** | Panificadora e Mercado Sabor de Mel (CNPJ 02.034.761/0001-90) |

O **SGEP** automatiza e profissionaliza o gerenciamento de encomendas personalizadas da panificadora: CRM com restrições alimentares (Glúten, Lactose e Açúcar), vitrine digital, encomendas com especificações técnicas, pagamento online via **Mercado Pago (Pix/Cartão)** ou no balcão, painel de produção, retirada, controle de inadimplência, receitas confidenciais, dashboard financeiro e segurança de conta por token enviado por e-mail.

---

## 🌐 Links Oficiais de Hospedagem (Produção)

| Ambiente | Link de Acesso |
| :--- | :--- |
| **🍞 Sistema SGEP (Aplicação Web)** | **[https://sgep-panificadora-sabor-de-mel.vercel.app/](https://sgep-panificadora-sabor-de-mel.vercel.app/)** |
| **📖 Manual do Usuário (Docusaurus)** | **[https://sgep-manual.vercel.app/](https://sgep-manual.vercel.app/)** |
| **⚙️ API REST (.NET 10 · Render)** | **[https://sgep-backend.onrender.com/health](https://sgep-backend.onrender.com/health)** |
| **🗄️ Banco de Dados** | PostgreSQL em Nuvem (Supabase · Session Pooler IPv4) |

**Acesso de avaliação (Administrador):** `higorgermano43@gmail.com` / `admin123`

> ⏱️ O plano gratuito do Render hiberna após 15 min sem uso; o primeiro acesso pode levar ~40 s para "acordar" a API.

---

## 🏗️ Arquitetura

```
SGEP/
├── BackEnd/        API REST C# / .NET 10 (ADO.NET + Npgsql, JWT, BCrypt, Mercado Pago SDK, Resend)
├── frontend/       Next.js 16 / React 19 / TypeScript (Axios, CSS Modules)
├── manual/         Manual do Usuário em Docusaurus 3 (18 telas reais)
├── ERS/            Manual do sistema / ERS (DOCX e PDF)
├── init.sql        Script completo do banco PostgreSQL
├── Dockerfile      Imagem de produção da API (.NET 10)
└── render.yaml     Blueprint de deploy no Render
```

* **Backend:** Controllers → Services → Repositories (SQL puro via Npgsql). Autenticação JWT (cookie `HttpOnly` + header `Bearer`), senhas com BCrypt, CORS dinâmico, healthcheck e inicialização automática do schema (`DatabaseInitializer`).
* **Frontend:** App Router do Next.js, menus e rotas adaptados por perfil (Cliente, Funcionário, Administrador).
* **Integrações:** Mercado Pago Checkout Pro (preferência, retorno e webhook) e Resend (e-mails transacionais via HTTPS).

---

## ✅ Funções da ERS (20/20 implementadas)

| # | Função | Classificação | Situação |
| :-: | :--- | :-: | :-: |
| 1 | Gerenciar Usuários | Básica | ✅ |
| 2 | Gerenciar Clientes (CRM) | Básica | ✅ |
| 3 | Gerenciar Categorias de Produtos | Básica | ✅ |
| 4 | Gerenciar Produtos | Básica | ✅ |
| 5 | Gerenciar Receitas (Módulo Privado) | Básica | ✅ |
| 6 | Gerenciar Permissões de Receitas | Básica | ✅ |
| 7 | Efetuar Encomenda Personalizada | Fundamental | ✅ |
| 8 | Vincular Especificações Técnicas ao Pedido | Fundamental | ✅ |
| 9 | Validar Alertas de Segurança Alimentar | Fundamental | ✅ |
| 10 | Registrar Recebimento de Pagamento (Mercado Pago / Balcão) | Fundamental | ✅ |
| 11 | Consultar Histórico de Inadimplência por CPF | Fundamental | ✅ |
| 12 | Gerar Ordem de Produção Técnica | Fundamental | ✅ |
| 13 | Visualizar Cronograma de Produção | Fundamental | ✅ |
| 14 | Atualizar Status da Produção | Fundamental | ✅ |
| 15 | Registrar Conclusão de Encomenda | Fundamental | ✅ |
| 16 | Registrar Entrega e Retirada de Pedido | Fundamental | ✅ |
| 17 | Liquidar Saldo Devedor na Entrega | Fundamental | ✅ |
| 18 | Recuperar Senha e Validar Operações de Conta com Token por E-mail | Fundamental | ✅ |
| 19 | Dashboard de Desempenho | Saída | ✅ |
| 20 | Emitir Relatório Estratégico (por período) | Saída | ✅ |

Detalhamento técnico: [`modelagem_20_funcoes_ers.md`](modelagem_20_funcoes_ers.md), [`ers_implementadas_documentacao.md`](ers_implementadas_documentacao.md) e [`ers_database_specification.md`](ers_database_specification.md).

---

## 🛠️ Execução Local

### Pré-requisitos
* [.NET SDK 10.0](https://dotnet.microsoft.com/download/dotnet/10.0)
* [Node.js 18+ LTS](https://nodejs.org/)
* [PostgreSQL 14+](https://www.postgresql.org/)

### 1. Banco de Dados
```bash
createdb sgep_db
psql -d sgep_db -f init.sql
```
O script cria as tabelas `usuario`, `cliente`, `token_autenticacao`, `categoria`, `produto`, `receita`, `encomenda`, `item_encomenda`, `pagamento` (e a auxiliar `caixa`) e cadastra apenas o administrador `higorgermano43@gmail.com` / `admin123`.

> A API também cria o schema automaticamente na primeira execução caso as tabelas não existam.

### 2. Backend
```bash
cd BackEnd/BackEnd
dotnet restore
dotnet run
```
Configure em `appsettings.json` / `appsettings.Development.json` (ou variáveis de ambiente):

| Variável de ambiente | Configuração equivalente | Descrição |
| :--- | :--- | :--- |
| `DATABASE_URL` | `ConnectionStrings:DefaultConnection` | Conexão PostgreSQL (aceita URI `postgresql://...`) |
| `JWT_SECRET` | `Jwt:Key` | Chave de assinatura JWT (mín. 32 caracteres) |
| `FRONTEND_URL` | `FrontendUrl` | URL do frontend (CORS e retorno do Mercado Pago) |
| `MERCADOPAGO_ACCESS_TOKEN` | `MercadoPago:AccessToken` | Token do Mercado Pago (TEST- ou APP_USR-) |
| `RESEND_API_KEY` | `Smtp:ApiKey` | Chave da API Resend para envio de e-mails |

Documentação interativa (modo Development): `http://localhost:5254/scalar/v1`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
```
Variável opcional: `NEXT_PUBLIC_API_URL` (padrão `http://localhost:5254`).

### 4. Manual do Usuário (Docusaurus)
```bash
cd manual
npm install
npm start              # http://localhost:3001
```

---

## ☁️ Deploy

| Camada | Plataforma | Endereço / Configuração |
| :--- | :--- | :--- |
| Banco | Supabase | Session Pooler (IPv4) → `DATABASE_URL` |
| API | Render (Docker) | https://sgep-backend.onrender.com (`Dockerfile` na raiz) |
| Frontend | Vercel | https://sgep-panificadora-sabor-de-mel.vercel.app/ (Root Directory: `frontend`) |
| Manual | Vercel | https://sgep-manual.vercel.app/ (Root Directory: `manual` · Docusaurus) |

Todo `git push` na branch `main` atualiza automaticamente Vercel e Render.

---

## 💳 Pagamentos (Mercado Pago Checkout Pro)

1. `POST /api/pagamentos/gerar-preferencia` — cria a preferência vinculada à encomenda e retorna o `initPoint`.
2. O cliente paga via Pix/Cartão e retorna para `/minhas-encomendas?status=sucesso`.
3. `POST /api/pagamentos/confirmar-retorno` e `POST /api/pagamentos/webhook` atualizam o pagamento para `pago` e a encomenda para *Em Andamento*.
4. Pagamentos no balcão: `POST /api/pagamentos/registrar-presencial` e liquidação em `POST /api/pagamentos/liquidar`.
