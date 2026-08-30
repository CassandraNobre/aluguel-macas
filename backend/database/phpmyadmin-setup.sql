-- InkStation - Script completo para colar no phpMyAdmin (aba SQL)
-- Cria o banco, as tabelas e os dados de teste

CREATE DATABASE IF NOT EXISTS inkstation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inkstation;

-- =============================================
-- USUARIOS
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(30),
    tipo_usuario VARCHAR(50) DEFAULT 'tatuador',
    google_id VARCHAR(255),
    ativo BOOLEAN DEFAULT 1,
    email_verificado BOOLEAN DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_google_id (google_id),
    INDEX idx_criado_em (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- ESTACOES
-- =============================================
CREATE TABLE IF NOT EXISTS estacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    imagem VARCHAR(500),
    recursos JSON,
    ativo BOOLEAN DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_nome (nome),
    INDEX idx_ativo (ativo),
    INDEX idx_criado_em (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- RESERVAS
-- =============================================
CREATE TABLE IF NOT EXISTS reservas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    estacao_id INT NOT NULL,
    entrada_data DATE NOT NULL,
    entrada_hora TIME NOT NULL,
    saida_data DATE NOT NULL,
    saida_hora TIME NOT NULL,
    observacoes TEXT,
    status ENUM('CONFIRMADA', 'PENDENTE', 'CONCLUIDA', 'CANCELADA') DEFAULT 'CONFIRMADA',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (estacao_id) REFERENCES estacoes(id) ON DELETE RESTRICT,

    INDEX idx_usuario_id (usuario_id),
    INDEX idx_estacao_id (estacao_id),
    INDEX idx_entrada_data (entrada_data),
    INDEX idx_status (status),
    INDEX idx_usuario_data (usuario_id, entrada_data),
    INDEX idx_estacao_data (estacao_id, entrada_data),
    UNIQUE KEY unique_estacao_time (estacao_id, entrada_data, entrada_hora, saida_hora, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- AUTH_TOKENS
-- =============================================
CREATE TABLE IF NOT EXISTS auth_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,

    INDEX idx_usuario_id (usuario_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_token_hash (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- DADOS DE TESTE
-- Senha de todos os usuários abaixo: senha123456
-- =============================================
INSERT INTO usuarios (nome, email, senha_hash, criado_em, atualizado_em) VALUES
('Artista Silva', 'artista@example.com', '$2b$12$Ee9oDwF1ubeFjx/dmle3ceOpP1VzAWhz.69ionxTnBI7eiH1Vm5fC', NOW(), NOW()),
('Tattoo Master', 'tattoo@example.com', '$2b$12$Ee9oDwF1ubeFjx/dmle3ceOpP1VzAWhz.69ionxTnBI7eiH1Vm5fC', NOW(), NOW()),
('Ink Creator', 'ink@example.com', '$2b$12$Ee9oDwF1ubeFjx/dmle3ceOpP1VzAWhz.69ionxTnBI7eiH1Vm5fC', NOW(), NOW());

INSERT INTO estacoes (nome, tipo, descricao, preco, imagem, recursos, ativo, criado_em, atualizado_em) VALUES
('Estação Premium 01', 'Premium', 'Estação de trabalho premium com equipamento de última geração e iluminação profissional', 35.00, 'https://example.com/estacao-premium-01.jpg', '["Cadeira ergonômica", "Iluminação LED", "Espelho 180°", "Esterilizador", "Ar condicionado"]', 1, NOW(), NOW()),
('Estação Premium 02', 'Premium', 'Estação de trabalho premium com equipamento de última geração e iluminação profissional', 35.00, 'https://example.com/estacao-premium-02.jpg', '["Cadeira ergonômica", "Iluminação LED", "Espelho 180°", "Esterilizador", "Ar condicionado"]', 1, NOW(), NOW()),
('Estação Padrão 01', 'Padrão', 'Estação de trabalho padrão bem equipada e confortável', 20.00, 'https://example.com/estacao-padrao-01.jpg', '["Cadeira confortável", "Iluminação boa", "Espelho", "Ar condicionado"]', 1, NOW(), NOW()),
('Estação Padrão 02', 'Padrão', 'Estação de trabalho padrão bem equipada e confortável', 20.00, 'https://example.com/estacao-padrao-02.jpg', '["Cadeira confortável", "Iluminação boa", "Espelho", "Ar condicionado"]', 1, NOW(), NOW());

INSERT INTO reservas (usuario_id, estacao_id, entrada_data, entrada_hora, saida_data, saida_hora, observacoes, status, criado_em, atualizado_em) VALUES
(1, 1, '2026-08-25', '09:00', '2026-08-25', '13:00', 'Sessão de realismo', 'CONFIRMADA', NOW(), NOW()),
(1, 2, '2026-08-26', '14:00', '2026-08-26', '17:00', 'Toque up em trabalho anterior', 'CONFIRMADA', NOW(), NOW()),
(2, 3, '2026-08-25', '10:00', '2026-08-25', '12:00', 'Consulta e desenho', 'CONFIRMADA', NOW(), NOW()),
(3, 4, '2026-08-27', '15:00', '2026-08-27', '18:00', 'Trabalho de cores', 'PENDENTE', NOW(), NOW());
