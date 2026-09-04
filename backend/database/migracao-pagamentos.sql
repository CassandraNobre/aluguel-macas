-- Migração: nome do cliente, forma de pagamento e estrutura de recebimento de pagamentos
-- Rode este script no Query Editor do Aiven (banco "inkstation"), depois do schema.sql inicial

ALTER TABLE reservas
    ADD COLUMN nome_cliente VARCHAR(255) NULL AFTER usuario_id,
    ADD COLUMN forma_pagamento ENUM('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO') NOT NULL DEFAULT 'PIX' AFTER observacoes;

-- =============================================
-- CONTAS_RECEBIMENTO: dados de quem recebe os pagamentos (o estúdio)
-- =============================================
CREATE TABLE IF NOT EXISTS contas_recebimento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titular VARCHAR(255) NOT NULL,
    tipo_chave_pix ENUM('CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA') NOT NULL,
    chave_pix VARCHAR(255) NOT NULL,
    banco VARCHAR(100),
    agencia VARCHAR(20),
    conta VARCHAR(30),
    ativo BOOLEAN DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- PAGAMENTOS: um registro de pagamento por reserva
-- =============================================
CREATE TABLE IF NOT EXISTS pagamentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reserva_id INT NOT NULL,
    conta_recebimento_id INT NULL,
    forma_pagamento ENUM('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO') NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDENTE', 'PAGO', 'ESTORNADO', 'CANCELADO') DEFAULT 'PENDENTE',
    comprovante_url VARCHAR(500),
    pago_em TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
    FOREIGN KEY (conta_recebimento_id) REFERENCES contas_recebimento(id) ON DELETE SET NULL,
    INDEX idx_reserva_id (reserva_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exemplo: cadastrar a conta que vai receber os pagamentos (edite com os dados reais)
-- INSERT INTO contas_recebimento (titular, tipo_chave_pix, chave_pix, banco, agencia, conta)
-- VALUES ('InkStation LTDA', 'CNPJ', '00.000.000/0001-00', 'Banco XYZ', '0001', '123456-7');
