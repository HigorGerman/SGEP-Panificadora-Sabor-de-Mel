---
id: cadastros-base
title: 4.3 Cadastros de Categorias, Produtos e Usuários
---

# 🗂️ Cadastros de Categorias, Produtos e Usuários

O Administrador gerencia toda a estrutura do catálogo, receitas e acessos da equipe através dos módulos de **Categorias**, **Produtos** e **Usuários**.

---

## 1. Gestão de Categorias (`/categorias`)

Antes de cadastrar os produtos, organize as seções da sua vitrine em **Categorias** (ex: *Pães*, *Bolos de Festa*, *Tortas Doces*, *Salgados para Festa*).

![Tela de Gestão de Categorias](/img/telas/16-categorias.png)

- Clique em **`+ Nova Categoria`** para criar uma seção.
- Você pode editar a descrição ou inativar/excluir categorias que não estejam vinculadas a produtos ativos.

---

## 2. Gestão de Produtos e Personalização (`/produtos`)

Na tela **Gestão de Produtos** (`/produtos`), o Administrador cadastra os itens que aparecerão na Vitrine Digital e na tela de Nova Encomenda.

![Tela de Gestão de Produtos](/img/telas/17-produtos.png)

### Campos do Cadastro de Produto:
1. **Nome do Produto, Preço Unitário (`R$`) e Categoria**.
2. **Descrição Pública:** Texto comercial exibido para os clientes no catálogo.
3. **URL da Imagem:** Cole o link da foto do produto (o modal exibe uma **pré-visualização ao vivo** da imagem antes de salvar).
4. **Indicadores de Alérgenos:** Marque se o produto **Contém Glúten**, **Contém Lactose** e/ou **Contém Açúcar** (usados pelo motor de alertas de saúde do cliente).
5. **Permite Personalização? (Template de Campos):**
   - Ao marcar esta opção, informe os campos separados por vírgula (ex: `Massa, Recheio, Frase Escrita, Topo de Bolo`).
   - Quando o cliente adicionar este produto à encomenda, o SGEP criará automaticamente essas caixas de texto para ele preencher!
6. **Ficha Técnica / Receita (Uso Interno):** Preencha *Ingredientes*, *Modo de Preparo* e *Rendimento* para consulta exclusiva dos confeiteiros e padeiros.

---

## 3. Gestão de Usuários e Equipe (`/usuarios`)

Na tela **Gestão de Usuários** (`/usuarios`), o Administrador cadastra e gerencia os acessos internos da panificadora.

![Tela de Gestão de Usuários](/img/telas/18-usuarios.png)

- **Perfis disponíveis:**
  - **Administrador (`0`):** Acesso total ao sistema, financeiro, inadimplência e cadastros.
  - **Funcionário (`1`):** Acesso focado na operação (Painel de Produção, Retirada, Receitas e Histórico).

