using System;
using System.Data;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace BackEnd.Repository
{
    public static class DatabaseInitializer
    {
        public static void ResetDatabase(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PostgresDbContext>();
            var conn = dbContext.GetConexao();
            if (conn.State != ConnectionState.Open)
            {
                conn.Open();
            }

            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
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
            ";
            cmd.ExecuteNonQuery();
            Console.WriteLine("🧹 [DatabaseInitializer] Todas as tabelas antigas foram removidas.");

            EnsureDatabaseInitialized(serviceProvider);
        }

        public static void EnsureDatabaseInitialized(IServiceProvider serviceProvider)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<PostgresDbContext>();
                var conn = dbContext.GetConexao();
                if (conn.State != ConnectionState.Open)
                {
                    conn.Open();
                }

                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS usuario (
                        id SERIAL PRIMARY KEY,
                        usuario_nome VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL UNIQUE,
                        senha VARCHAR(255) NOT NULL,
                        perfil_enum INTEGER NOT NULL,
                        excluido BOOLEAN NOT NULL DEFAULT FALSE
                    );

                    CREATE TABLE IF NOT EXISTS cliente (
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

                    CREATE TABLE IF NOT EXISTS token_autenticacao (
                        id SERIAL PRIMARY KEY,
                        cliente_id INTEGER NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
                        codigo_token VARCHAR(6) NOT NULL,
                        tipo_token VARCHAR(50) NOT NULL,
                        data_expiracao TIMESTAMP NOT NULL,
                        utilizado BOOLEAN NOT NULL DEFAULT FALSE,
                        data_criacao TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
                    );

                    CREATE TABLE IF NOT EXISTS categoria (
                        id SERIAL PRIMARY KEY,
                        descricao VARCHAR(255) NOT NULL,
                        inativo BOOLEAN NOT NULL DEFAULT FALSE
                    );

                    CREATE TABLE IF NOT EXISTS produto (
                        id SERIAL PRIMARY KEY,
                        nome VARCHAR(255) NOT NULL,
                        preco_unitario NUMERIC(10, 2) NOT NULL,
                        categoria_id INTEGER NOT NULL REFERENCES categoria(id),
                        imagem_url VARCHAR(2048),
                        descricao TEXT,
                        permite_customizacao BOOLEAN NOT NULL DEFAULT FALSE,
                        template_customizacao JSONB,
                        contem_gluten BOOLEAN NOT NULL DEFAULT TRUE,
                        contem_lactose BOOLEAN NOT NULL DEFAULT TRUE,
                        contem_acucar BOOLEAN NOT NULL DEFAULT TRUE
                    );

                    CREATE TABLE IF NOT EXISTS receita (
                        id SERIAL PRIMARY KEY,
                        produto_id INTEGER NOT NULL UNIQUE REFERENCES produto(id) ON DELETE CASCADE,
                        ingredientes TEXT,
                        modo_preparo TEXT,
                        rendimento VARCHAR(255)
                    );

                    CREATE TABLE IF NOT EXISTS encomenda (
                        id SERIAL PRIMARY KEY,
                        cliente_id INTEGER REFERENCES cliente(id),
                        usuario_id INTEGER REFERENCES usuario(id),
                        data_retirada TIMESTAMP NOT NULL,
                        valor_total NUMERIC(10, 2) NOT NULL,
                        status_enum INTEGER NOT NULL DEFAULT 0,
                        observacao TEXT,
                        data_entrega_real TIMESTAMP,
                        usuario_entrega_id INTEGER REFERENCES usuario(id)
                    );

                    CREATE TABLE IF NOT EXISTS item_encomenda (
                        id SERIAL PRIMARY KEY,
                        encomenda_id INTEGER NOT NULL REFERENCES encomenda(id) ON DELETE CASCADE,
                        produto_id INTEGER NOT NULL REFERENCES produto(id),
                        quantidade INTEGER NOT NULL CHECK (quantidade > 0),
                        preco_no_ato NUMERIC(10, 2) NOT NULL,
                        especificacoes_tecnicas JSONB
                    );

                    CREATE TABLE IF NOT EXISTS caixa (
                        id SERIAL PRIMARY KEY,
                        data_abertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        valor_inicial NUMERIC(10, 2) NOT NULL,
                        status VARCHAR(50) NOT NULL DEFAULT 'Aberto',
                        data_fechamento TIMESTAMP,
                        valor_final NUMERIC(10, 2)
                    );

                    CREATE TABLE IF NOT EXISTS pagamento (
                        id SERIAL PRIMARY KEY,
                        encomenda_id INTEGER NOT NULL REFERENCES encomenda(id) ON DELETE CASCADE,
                        caixa_id INTEGER REFERENCES caixa(id),
                        valor_total NUMERIC(10, 2) DEFAULT 0.00,
                        valor_sinal NUMERIC(10, 2) DEFAULT 0.00,
                        saldo_devedor NUMERIC(10, 2) DEFAULT 0.00,
                        forma_pagamento_sinal VARCHAR(100),
                        status VARCHAR(50) NOT NULL DEFAULT 'pendente',
                        forma_pagamento VARCHAR(100) DEFAULT 'Não informada',
                        preference_id VARCHAR(255),
                        mp_payment_id BIGINT,
                        data_criacao TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
                    );
                ";
                cmd.ExecuteNonQuery();

                // Seed inicial caso o banco esteja vazio (primeiro deploy na nuvem)
                using var checkCmd = conn.CreateCommand();
                checkCmd.CommandText = "SELECT COUNT(*) FROM usuario;";
                var userCount = Convert.ToInt64(checkCmd.ExecuteScalar());

                if (userCount == 0)
                {
                    using var seedCmd = conn.CreateCommand();
                    seedCmd.CommandText = @"
                        INSERT INTO usuario (usuario_nome, email, senha, perfil_enum, excluido)
                        VALUES (@nome, @email, @senha, 0, FALSE);
                    ";
                    seedCmd.Parameters.AddWithValue("@nome", "Higor Germano");
                    seedCmd.Parameters.AddWithValue("@email", "higorgermano43@gmail.com");
                    seedCmd.Parameters.AddWithValue("@senha", BCrypt.Net.BCrypt.HashPassword("admin123"));
                    seedCmd.ExecuteNonQuery();
                    Console.WriteLine("✅ [DatabaseInitializer] Tabelas criadas e usuário Admin (higorgermano43@gmail.com) cadastrado com sucesso!");
                }
                else
                {
                    Console.WriteLine("✅ [DatabaseInitializer] Schema do banco de dados verificado com sucesso!");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ [DatabaseInitializer] Aviso ao verificar/inicializar banco de dados: {ex.Message}");
            }
        }
    }
}

