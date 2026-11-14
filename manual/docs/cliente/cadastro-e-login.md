---
id: cadastro-e-login
title: 2.1 Cadastro, Login e Recuperação de Senha
---

# 🔐 Cadastro, Login e Recuperação de Senha

Para realizar encomendas e acompanhar o status de preparo na **Panificadora Sabor de Mel**, o cliente pode criar sua conta rapidamente ou acessar com um cadastro já existente.

---

## 1. Tela de Login

Na tela de **Login** (`/login`), tanto **Clientes** quanto **Funcionários/Administradores** utilizam o mesmo formulário unificado.

![Tela de Login do SGEP](/img/telas/02-login.png)

### Como acessar:
1. No campo **E-mail ou CPF**, informe o seu endereço de e-mail cadastrado ou o número do seu CPF.
2. Digite a sua **Senha** (você pode clicar no ícone de olho 👁️ para conferir os caracteres digitados).
3. Clique no botão **Entrar**.

---

## 2. Criando uma Nova Conta de Cliente

Caso ainda não possua conta, clique em **"Registre-se"** na parte inferior da tela de login para abrir o formulário de cadastro (`/registro`).

![Tela de Cadastro de Cliente](/img/telas/03-registro.png)

### Passo a passo do cadastro:
1. **Dados Pessoais:** Preencha seu **Nome Completo**, **CPF**, **Telefone/WhatsApp**, **E-mail** e defina uma **Senha** segura.
2. **Preferências e Restrições Alimentares (Saúde do Cliente):**
   - Marque as opções caso você possua alguma restrição alimentar:
     - 🌾 **Restrição a Glúten (Celíaco)**
     - 🥛 **Intolerância à Lactose**
     - 🍬 **Restrição a Açúcar (Diabético)**
   - :::info Proteção Automática
     Sempre que você tentar adicionar à sua encomenda um produto que contenha algum ingrediente incompatível com suas restrições, o SGEP exibirá um **alerta preventivo de segurança alimentar**!
     :::
3. Clique em **Criar Minha Conta**.

---

## 3. Recuperação de Senha por Código de 6 Dígitos

Esqueceu sua senha? O SGEP conta com um fluxo seguro de recuperação por **token temporário enviado por e-mail**:

![Modal de Recuperação de Senha](/img/telas/04-recuperar-senha.png)

1. Na tela de Login, clique em **"Esqueci minha senha"**.
2. Informe o seu **E-mail cadastrado** e clique em **Enviar Código**.
3. Você receberá no seu e-mail um **código numérico de 6 dígitos** (válido por **15 minutos**).
4. Na segunda etapa da janela, digite o **código de 6 dígitos**, informe a **Nova Senha** (mínimo de 6 caracteres), confirme-a e clique em **Redefinir Senha**.

