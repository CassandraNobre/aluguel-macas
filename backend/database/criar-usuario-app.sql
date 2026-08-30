-- Cria um usuário dedicado para o backend Node.js conectar via TCP
CREATE USER IF NOT EXISTS 'inkstation_app'@'%' IDENTIFIED BY 'Inkstation123!';
GRANT ALL PRIVILEGES ON inkstation.* TO 'inkstation_app'@'%';
FLUSH PRIVILEGES;
