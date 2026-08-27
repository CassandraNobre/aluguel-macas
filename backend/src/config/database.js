const mysql = require('mysql2/promise');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const requiredProductionVariables = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'];
if (isProduction) {
    const missingVariables = requiredProductionVariables.filter((name) => !process.env[name]);
    if (missingVariables.length) {
        throw new Error(`Variáveis de banco ausentes: ${missingVariables.join(', ')}`);
    }
}

const sslEnabled = /^true$/i.test(process.env.DB_SSL || '');
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS ?? '',
    database: process.env.DB_NAME || 'inkstation',
    waitForConnections: true,
    connectionLimit: 10,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {})
});

module.exports = db;