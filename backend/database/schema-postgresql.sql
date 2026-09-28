-- Schema PostgreSQL oficial do InkStation (execute no banco da aplicação)
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL, telefone VARCHAR(30), tipo_usuario VARCHAR(50) NOT NULL DEFAULT 'tatuador',
  ativo BOOLEAN NOT NULL DEFAULT TRUE, criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(), atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estacoes (
  id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL, tipo VARCHAR(100), descricao TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL CHECK (preco > 0), imagem VARCHAR(500), recursos JSONB NOT NULL DEFAULT '[]',
  ativo BOOLEAN NOT NULL DEFAULT TRUE, criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(), atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservas (
  id SERIAL PRIMARY KEY, usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  estacao_id INTEGER NOT NULL REFERENCES estacoes(id) ON DELETE RESTRICT,
  entrada_data DATE NOT NULL, entrada_hora TIME NOT NULL, saida_data DATE NOT NULL, saida_hora TIME NOT NULL,
  observacoes TEXT, nome_cliente VARCHAR(255), forma_pagamento VARCHAR(30) DEFAULT 'PIX',
  status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADA' CHECK (status IN ('CONFIRMADA','PENDENTE','CONCLUIDA','CANCELADA')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(), atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (saida_data + saida_hora > entrada_data + entrada_hora)
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id SERIAL PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY, usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  acao VARCHAR(100) NOT NULL, tabela VARCHAR(100) NOT NULL, registro_id INTEGER,
  dados_anteriores JSONB, dados_novos JSONB, ip_address INET, user_agent VARCHAR(500), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estacoes_ativas ON estacoes (ativo);
CREATE INDEX IF NOT EXISTS idx_reservas_agenda ON reservas (estacao_id, entrada_data, entrada_hora);
CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas (usuario_id, entrada_data);
