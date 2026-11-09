-- ==============================================================================
-- SGEP - Sistema de Gestão de Encomendas de Panificadora (Sabor de Mel)
-- Script de Criação e Inicialização do Banco de Dados PostgreSQL (init.sql)
-- ==============================================================================

-- 1. Limpeza preventiva de tabelas existentes (mantendo ordem de dependência)
DROP TABLE IF EXISTS token_autenticacao CASCADE;
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
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    bloqueado_encomendas BOOLEAN NOT NULL DEFAULT FALSE,
    motivo_bloqueio VARCHAR(255)
);

-- Tabela: token_autenticacao (Tokens de Recuperação e Exclusão por E-mail)
CREATE TABLE token_autenticacao (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    codigo_token VARCHAR(6) NOT NULL,
    tipo_token VARCHAR(50) NOT NULL, -- 'RECUPERACAO_SENHA', 'EXCLUSAO_CONTA'
    data_expiracao TIMESTAMP NOT NULL,
    utilizado BOOLEAN NOT NULL DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
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
    valor_total NUMERIC(10, 2) DEFAULT 0.00,
    valor_sinal NUMERIC(10, 2) DEFAULT 0.00,
    saldo_devedor NUMERIC(10, 2) DEFAULT 0.00,
    forma_pagamento_sinal VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pendente', -- 'pendente', 'pago', 'sinal_pago', 'cancelado'
    forma_pagamento VARCHAR(100) DEFAULT 'Não informada',
    preference_id VARCHAR(255),
    mp_payment_id BIGINT,
    data_criacao TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- ==============================================================================
-- 3. Carga Inicial de Dados (Apenas Usuário Administrador)
-- ==============================================================================

-- Inserindo Único Usuário Administrador Inicial (Senha: admin123)
INSERT INTO usuario (usuario_nome, email, senha, perfil_enum, excluido) VALUES
('Higor Germano', 'higorgermano43@gmail.com', 'admin123', 0, FALSE);

-- ==============================================================================
-- Fim do Script SQL
-- ==============================================================================
