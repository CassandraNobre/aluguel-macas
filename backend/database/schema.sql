-- InkStation Database Schema
-- Complete database setup for the coworking tattoo studio system

-- Create database
CREATE DATABASE IF NOT EXISTS inkstation;
USE inkstation;

-- =============================================
-- USUARIOS TABLE
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
-- ESTACOES TABLE
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
-- RESERVAS TABLE
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
-- AUTH_TOKENS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS auth_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_token_hash (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- AUDIT LOG TABLE (Optional but recommended)
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    acao VARCHAR(100),
    tabela VARCHAR(100),
    registro_id INT,
    dados_anteriores JSON,
    dados_novos JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- INSERT SAMPLE DATA
-- =============================================

-- Sample users
INSERT INTO usuarios (nome, email, senha_hash, criado_em, atualizado_em) VALUES
('Artista Silva', 'artista@example.com', '$2b$12$zD5SADESwsRCvqOfhwc3VeOob2.tyKfPjY.6LzEU1R7c9WESldt.u', NOW(), NOW()),
('Tattoo Master', 'tattoo@example.com', '$2b$12$zD5SADESwsRCvqOfhwc3VeOob2.tyKfPjY.6LzEU1R7c9WESldt.u', NOW(), NOW()),
('Ink Creator', 'ink@example.com', '$2b$12$zD5SADESwsRCvqOfhwc3VeOob2.tyKfPjY.6LzEU1R7c9WESldt.u', NOW(), NOW());

-- Sample workstations
INSERT INTO estacoes (nome, tipo, descricao, preco, imagem, recursos, ativo, criado_em, atualizado_em) VALUES
(
    'Estação Premium 01',
    'Premium',
    'Estação de trabalho premium com equipamento de última geração e iluminação profissional',
    35.00,
    'https://example.com/estacao-premium-01.jpg',
    '["Cadeira ergonômica", "Iluminação LED", "Espelho 180°", "Esterilizador", "Ar condicionado"]',
    1,
    NOW(),
    NOW()
),
(
    'Estação Premium 02',
    'Premium',
    'Estação de trabalho premium com equipamento de última geração e iluminação profissional',
    35.00,
    'https://example.com/estacao-premium-02.jpg',
    '["Cadeira ergonômica", "Iluminação LED", "Espelho 180°", "Esterilizador", "Ar condicionado"]',
    1,
    NOW(),
    NOW()
),
(
    'Estação Padrão 01',
    'Padrão',
    'Estação de trabalho padrão bem equipada e confortável',
    20.00,
    'https://example.com/estacao-padrao-01.jpg',
    '["Cadeira confortável", "Iluminação boa", "Espelho", "Ar condicionado"]',
    1,
    NOW(),
    NOW()
),
(
    'Estação Padrão 02',
    'Padrão',
    'Estação de trabalho padrão bem equipada e confortável',
    20.00,
    'https://example.com/estacao-padrao-02.jpg',
    '["Cadeira confortável", "Iluminação boa", "Espelho", "Ar condicionado"]',
    1,
    NOW(),
    NOW()
);

-- Sample reservations (for testing purposes)
INSERT INTO reservas (usuario_id, estacao_id, entrada_data, entrada_hora, saida_data, saida_hora, observacoes, status, criado_em, atualizado_em) VALUES
(1, 1, '2026-08-25', '09:00', '2026-08-25', '13:00', 'Sessão de realismo', 'CONFIRMADA', NOW(), NOW()),
(1, 2, '2026-08-26', '14:00', '2026-08-26', '17:00', 'Toque up em trabalho anterior', 'CONFIRMADA', NOW(), NOW()),
(2, 3, '2026-08-25', '10:00', '2026-08-25', '12:00', 'Consulta e desenho', 'CONFIRMADA', NOW(), NOW()),
(3, 4, '2026-08-27', '15:00', '2026-08-27', '18:00', 'Trabalho de cores', 'PENDENTE', NOW(), NOW());

-- =============================================
-- CREATE STORED PROCEDURES (Optional)
-- =============================================

-- Procedure to get available times for a workstation on a specific date
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS sp_get_available_slots(
    IN p_estacao_id INT,
    IN p_data DATE
)
BEGIN
    SELECT 
        entrada_hora AS horario_inicio,
        saida_hora AS horario_fim,
        STATUS
    FROM reservas
    WHERE estacao_id = p_estacao_id
        AND entrada_data = p_data
        AND status IN ('CONFIRMADA', 'PENDENTE')
    ORDER BY entrada_hora;
END //

DELIMITER ;

-- Procedure to check conflict
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS sp_check_schedule_conflict(
    IN p_estacao_id INT,
    IN p_data DATE,
    IN p_horario_inicio TIME,
    IN p_horario_fim TIME,
    OUT p_conflict_exists INT
)
BEGIN
    SELECT COUNT(*) INTO p_conflict_exists
    FROM reservas
    WHERE estacao_id = p_estacao_id
        AND entrada_data = p_data
        AND status IN ('CONFIRMADA', 'PENDENTE')
        AND entrada_hora < p_horario_fim
        AND saida_hora > p_horario_inicio;
END //

DELIMITER ;

-- =============================================
-- VIEWS (Optional but useful)
-- =============================================

CREATE OR REPLACE VIEW vw_usuario_reservas AS
SELECT 
    r.id,
    r.usuario_id,
    u.nome,
    u.email,
    r.estacao_id,
    e.nome as estacao_nome,
    r.entrada_data AS data,
    r.entrada_hora AS horario_inicio,
    r.saida_hora AS horario_fim,
    ROUND(TIMESTAMPDIFF(MINUTE, CONCAT(r.entrada_data, ' ', r.entrada_hora), CONCAT(r.saida_data, ' ', r.saida_hora)) / 60, 2) AS duracao,
    ROUND(TIMESTAMPDIFF(MINUTE, CONCAT(r.entrada_data, ' ', r.entrada_hora), CONCAT(r.saida_data, ' ', r.saida_hora)) / 60 * e.preco, 2) AS valor_total,
    r.status,
    r.criado_em
FROM reservas r
JOIN usuarios u ON r.usuario_id = u.id
JOIN estacoes e ON r.estacao_id = e.id
ORDER BY r.entrada_data DESC, r.entrada_hora DESC;

CREATE OR REPLACE VIEW vw_estacao_ocupacao AS
SELECT 
    e.id,
    e.nome,
    COUNT(r.id) as total_reservas,
    SUM(CASE WHEN r.status = 'CONFIRMADA' THEN 1 ELSE 0 END) as reservas_confirmadas,
    SUM(CASE WHEN r.status = 'CANCELADA' THEN 1 ELSE 0 END) as reservas_canceladas,
    ROUND(SUM(TIMESTAMPDIFF(MINUTE, CONCAT(r.entrada_data, ' ', r.entrada_hora), CONCAT(r.saida_data, ' ', r.saida_hora)) / 60 * e.preco), 2) as receita_total
FROM estacoes e
LEFT JOIN reservas r ON e.id = r.estacao_id AND YEAR(r.entrada_data) = YEAR(CURDATE())
GROUP BY e.id, e.nome;
