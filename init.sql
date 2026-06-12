-- ==============================================================================
-- SGEP - Sistema de Gestão de Encomendas de Panificadora (Sabor de Mel)
-- Script de Criação e Inicialização do Banco de Dados PostgreSQL (init.sql)
-- ==============================================================================

-- 1. Limpeza preventiva de tabelas existentes (mantendo ordem de dependência)
DROP TABLE IF EXISTS pagamento CASCADE;
DROP TABLE IF EXISTS caixa CASCADE;
DROP TABLE IF EXISTS item_encomenda CASCADE;
DROP TABLE IF EXISTS encomenda CASCADE;
DROP TABLE IF EXISTS receita CASCADE;
DROP TABLE IF EXISTS produto CASCADE;
DROP TABLE IF EXISTS categoria CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

-- ==============================================================================
-- 2. Criação das Tabelas
-- ==============================================================================

-- Tabela: usuario (Funcionários e Administradores)
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    usuario_nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil_enum INTEGER NOT NULL, -- 0: Admin, 1: Funcionario
    excluido BOOLEAN NOT NULL DEFAULT FALSE
);

-- Tabela: cliente (CRM e Portal do Cliente)
CREATE TABLE cliente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    email VARCHAR(255) UNIQUE,
    senha VARCHAR(255),
    telefone VARCHAR(20),
    restricao_gluten BOOLEAN NOT NULL DEFAULT FALSE,
    restricao_lactose BOOLEAN NOT NULL DEFAULT FALSE,
    restricao_acucar BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabela: categoria (Categorias de Produtos)
CREATE TABLE categoria (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    inativo BOOLEAN NOT NULL DEFAULT FALSE
);

-- Tabela: produto (Catálogo de Produtos)
CREATE TABLE produto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    preco_unitario NUMERIC(10, 2) NOT NULL,
    categoria_id INTEGER NOT NULL REFERENCES categoria(id),
    imagem_url VARCHAR(2048),
    descricao TEXT,
    permite_customizacao BOOLEAN NOT NULL DEFAULT FALSE,
    template_customizacao JSONB, -- Formato JSON com campos para customização
    contem_gluten BOOLEAN NOT NULL DEFAULT TRUE,
    contem_lactose BOOLEAN NOT NULL DEFAULT TRUE,
    contem_acucar BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabela: receita (Ficha Técnica Confidencial de Fabricação)
CREATE TABLE receita (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER NOT NULL UNIQUE REFERENCES produto(id) ON DELETE CASCADE,
    ingredientes TEXT,
    modo_preparo TEXT,
    rendimento VARCHAR(255)
);

-- Tabela: encomenda (Cabeçalho do Pedido de Encomenda)
CREATE TABLE encomenda (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES cliente(id),
    usuario_id INTEGER REFERENCES usuario(id),
    data_retirada TIMESTAMP NOT NULL,
    valor_total NUMERIC(10, 2) NOT NULL,
    status_enum INTEGER NOT NULL DEFAULT 0, -- 0: Pendente, 1: Em Andamento, 2: Concluida, 3: Cancelada, 4: Entregue
    observacao TEXT,
    data_entrega_real TIMESTAMP,
    usuario_entrega_id INTEGER REFERENCES usuario(id)
);

-- Tabela: item_encomenda (Linhas de Itens no Pedido)
CREATE TABLE item_encomenda (
    id SERIAL PRIMARY KEY,
    encomenda_id INTEGER NOT NULL REFERENCES encomenda(id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produto(id),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_no_ato NUMERIC(10, 2) NOT NULL,
    especificacoes_tecnicas JSONB -- Customizações do cliente
);

-- Tabela: caixa (Fluxo Diário / Turno Financeiro)
CREATE TABLE caixa (
    id SERIAL PRIMARY KEY,
    data_abertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor_inicial NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Aberto', -- 'Aberto', 'Fechado'
    data_fechamento TIMESTAMP,
    valor_final NUMERIC(10, 2)
);

-- Tabela: pagamento (Situação Financeira das Encomendas)
CREATE TABLE pagamento (
    id SERIAL PRIMARY KEY,
    encomenda_id INTEGER NOT NULL REFERENCES encomenda(id) ON DELETE CASCADE,
    caixa_id INTEGER REFERENCES caixa(id),
    valor_sinal NUMERIC(10, 2),
    saldo_devedor NUMERIC(10, 2),
    forma_pagamento_sinal VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pendente', -- 'pendente', 'pago', 'sinal_pago', 'cancelado'
    forma_pagamento VARCHAR(100) DEFAULT 'Não informada'
);

-- ==============================================================================
-- 3. Carga Inicial de Dados (Seed Data)
-- ==============================================================================

-- Senha padrão para os seeds abaixo: admin123 (hash BCrypt)
-- Hash gerado: $2a$11$N9qo8uLOuGCKEC7z6F2GyeLw2S07U.3uEw70RntwS6P6qT6TymD/6

-- Inserindo Usuário Administrador Inicial
INSERT INTO usuario (usuario_nome, email, senha, perfil_enum, excluido) VALUES
('Administrador Sabor de Mel', 'admin@sabordemel.com', '$2a$11$N9qo8uLOuGCKEC7z6F2GyeLw2S07U.3uEw70RntwS6P6qT6TymD/6', 0, FALSE),
('Funcionário de Vendas', 'funcionario@sabordemel.com', '$2a$11$N9qo8uLOuGCKEC7z6F2GyeLw2S07U.3uEw70RntwS6P6qT6TymD/6', 1, FALSE);

-- Inserindo Categorias de Produtos
INSERT INTO categoria (descricao, inativo) VALUES
('Pães', FALSE),
('Bolos de Festa', FALSE),
('Tortas Doces', FALSE),
('Salgados para Festa', FALSE),
('Doces e Sobremesas', FALSE);

-- Inserindo Clientes de Teste (com diferentes restrições alimentares)
INSERT INTO cliente (nome, cpf, email, senha, telefone, restricao_gluten, restricao_lactose, restricao_acucar, ativo) VALUES
('Higor Cliente Comum', '111.222.333-44', 'cliente@sabordemel.com', '$2a$11$N9qo8uLOuGCKEC7z6F2GyeLw2S07U.3uEw70RntwS6P6qT6TymD/6', '(11) 98888-7777', FALSE, FALSE, FALSE, TRUE),
('Maria Célia (Intolerante Lactose)', '222.333.444-55', 'maria@exemplo.com', NULL, '(11) 97777-6666', FALSE, TRUE, FALSE, TRUE),
('João Diabético (Sem Açúcar)', '333.444.555-66', 'joao@exemplo.com', NULL, '(11) 96666-5555', FALSE, FALSE, TRUE, TRUE);

-- Inserindo Produtos Padrão
INSERT INTO produto (nome, preco_unitario, categoria_id, imagem_url, descricao, permite_customizacao, template_customizacao, contem_gluten, contem_lactose, contem_acucar) VALUES
('Pão Francês 50g', 0.80, 1, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', 'Clássico pão francês sempre fresquinho e crocante.', FALSE, NULL, TRUE, FALSE, FALSE),
('Bolo de Festa Personalizado', 60.00, 2, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', 'Bolo decorado para aniversários e celebrações. Escolha o recheio e a frase.', TRUE, '["Massa", "Recheio", "Frase Escrita"]'::jsonb, TRUE, TRUE, TRUE),
('Torta de Morango', 45.00, 3, 'https://images.unsplash.com/photo-1464305795204-6f5bdf7f81b1?w=400', 'Torta doce recheada com creme de confeiteiro e cobertura de morangos frescos.', FALSE, NULL, TRUE, TRUE, TRUE),
('Cento de Coxinha de Frango', 80.00, 4, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400', 'Coxinhas de frango desfiado com massa de batata frita super crocante.', FALSE, NULL, TRUE, FALSE, FALSE);

-- Inserindo Receita Confidencial (Bolo de Festa Personalizado - ID: 2)
INSERT INTO receita (produto_id, ingredientes, modo_preparo, rendimento) VALUES
(2, 'Farinha de trigo, açúcar, ovos, leite condensado, leite integral, chocolate em pó, fermento químico.', '1. Bata as claras em neve.\n2. Misture as gemas, açúcar e manteiga.\n3. Incorpore a farinha de trigo e fermento aos poucos.\n4. Asse o bolo de massa básica.\n5. Prepare o recheio de brigadeiro gourmet com leite condensado e cacau.\n6. Corte a massa ao meio, recheie e aplique a cobertura de chantilly.', '1 bolo de aproximadamente 1.5kg a 2kg');

-- ==============================================================================
-- Fim do Script SQL
-- ==============================================================================
