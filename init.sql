-- ==============================================================================
-- SGEP - Sistema de Gestão de Encomendas e Fluxo de Produção
-- Panificadora e Mercado Sabor de Mel - Santo Expedito/SP
-- Script de Criação e Inicialização do Banco de Dados PostgreSQL (init.sql)
-- Versão de Entrega Final - Estágio Supervisionado FIPP/Unoeste (02/2026)
-- ==============================================================================
-- Observação: a API (.NET) também executa automaticamente este mesmo schema ao
-- iniciar (DatabaseInitializer.cs), criando as tabelas caso não existam.
-- ==============================================================================

-- 1. Limpeza preventiva (ordem de dependência)
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

-- [F1 / F6] usuario: Administradores (0) e Funcionários (1)
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    usuario_nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,                 -- Hash BCrypt
    perfil_enum INTEGER NOT NULL,                -- 0: Administrador, 1: Funcionário
    excluido BOOLEAN NOT NULL DEFAULT FALSE      -- Exclusão lógica
);

-- [F2 / F11] cliente: CRM, restrições alimentares e controle de inadimplência
CREATE TABLE cliente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    email VARCHAR(255) UNIQUE,
    senha VARCHAR(255),                          -- Hash BCrypt (portal do cliente)
    telefone VARCHAR(20),
    restricao_gluten BOOLEAN NOT NULL DEFAULT FALSE,
    restricao_lactose BOOLEAN NOT NULL DEFAULT FALSE,
    restricao_acucar BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,         -- Exclusão lógica (soft delete / LGPD)
    bloqueado_encomendas BOOLEAN NOT NULL DEFAULT FALSE,  -- Bloqueio manual por inadimplência
    motivo_bloqueio VARCHAR(255)
);

-- [F18] token_autenticacao: códigos de 6 dígitos enviados por e-mail (validade 15 min)
-- cliente_id > 0  -> referencia cliente(id)
-- cliente_id < 0  -> referencia usuario(id) (recuperação de senha de Admin/Funcionário)
CREATE TABLE token_autenticacao (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    codigo_token VARCHAR(6) NOT NULL,
    tipo_token VARCHAR(50) NOT NULL,             -- RECUPERACAO_SENHA | ALTERACAO_PERFIL | EXCLUSAO_CONTA
    data_expiracao TIMESTAMP NOT NULL,
    utilizado BOOLEAN NOT NULL DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- [F3] categoria
CREATE TABLE categoria (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    inativo BOOLEAN NOT NULL DEFAULT FALSE
);

-- [F4] produto: catálogo, alérgenos e template de personalização
CREATE TABLE produto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    preco_unitario NUMERIC(10, 2) NOT NULL,
    categoria_id INTEGER NOT NULL REFERENCES categoria(id),
    imagem_url VARCHAR(2048),
    descricao TEXT,
    permite_customizacao BOOLEAN NOT NULL DEFAULT FALSE,
    template_customizacao JSONB,                 -- Ex: ["Massa", "Recheio", "Frase Escrita"]
    contem_gluten BOOLEAN NOT NULL DEFAULT TRUE,
    contem_lactose BOOLEAN NOT NULL DEFAULT TRUE,
    contem_acucar BOOLEAN NOT NULL DEFAULT TRUE
);

-- [F5] receita: ficha técnica confidencial (1:1 com produto)
CREATE TABLE receita (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER NOT NULL UNIQUE REFERENCES produto(id) ON DELETE CASCADE,
    ingredientes TEXT,
    modo_preparo TEXT,
    rendimento VARCHAR(255)
);

-- [F7 / F13 / F14 / F15 / F16] encomenda
CREATE TABLE encomenda (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES cliente(id),
    usuario_id INTEGER REFERENCES usuario(id),
    data_retirada TIMESTAMP NOT NULL,
    valor_total NUMERIC(10, 2) NOT NULL,
    status_enum INTEGER NOT NULL DEFAULT 0,      -- 0: Pendente, 1: Em Andamento, 2: Concluída, 3: Cancelada, 4: Entregue
    observacao TEXT,
    data_entrega_real TIMESTAMP,
    usuario_entrega_id INTEGER REFERENCES usuario(id)
);

-- [F8] item_encomenda: itens + especificações técnicas (JSONB)
CREATE TABLE item_encomenda (
    id SERIAL PRIMARY KEY,
    encomenda_id INTEGER NOT NULL REFERENCES encomenda(id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produto(id),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_no_ato NUMERIC(10, 2) NOT NULL,
    especificacoes_tecnicas JSONB
);

-- caixa: tabela auxiliar para vínculo opcional de turno financeiro (pagamento.caixa_id)
CREATE TABLE caixa (
    id SERIAL PRIMARY KEY,
    data_abertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor_inicial NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Aberto',
    data_fechamento TIMESTAMP,
    valor_final NUMERIC(10, 2)
);

-- [F10 / F11 / F17 / F19 / F20] pagamento: Mercado Pago (online) ou Balcão (presencial)
CREATE TABLE pagamento (
    id SERIAL PRIMARY KEY,
    encomenda_id INTEGER NOT NULL REFERENCES encomenda(id) ON DELETE CASCADE,
    caixa_id INTEGER REFERENCES caixa(id),
    valor_total NUMERIC(10, 2) DEFAULT 0.00,
    valor_sinal NUMERIC(10, 2) DEFAULT 0.00,
    saldo_devedor NUMERIC(10, 2) DEFAULT 0.00,
    forma_pagamento_sinal VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pendente', -- pendente | pago | sinal_pago | cancelado
    forma_pagamento VARCHAR(100) DEFAULT 'Não informada',
    preference_id VARCHAR(255),                  -- ID da preferência Mercado Pago (Checkout Pro)
    mp_payment_id BIGINT,                        -- ID do pagamento aprovado no Mercado Pago
    data_criacao TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- ==============================================================================
-- 3. Carga Inicial (apenas o Administrador do sistema)
-- ==============================================================================
-- Login: higorgermano43@gmail.com | Senha: admin123 (hash BCrypt)
INSERT INTO usuario (usuario_nome, email, senha, perfil_enum, excluido) VALUES
('Higor Germano', 'higorgermano43@gmail.com', '$2a$11$8KXzgodlpFzunpegwCDiYex0gz0/WmN3Hzl2re840ScQXielxCyfC', 0, FALSE);

-- ==============================================================================
-- Fim do Script SQL
-- ==============================================================================
