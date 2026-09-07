const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// ... (createFallbackDatabase function remains the same as before)
// (Note: To keep this surgical, I will assume createFallbackDatabase is already in the file. 
// I need to ensure the logic below replaces the pool initialization part correctly.)

const fallbackDb = createFallbackDatabase();
let pool = null;

if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' || process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    });
    console.log('Pool do Postgres configurado.');
} else {
    console.log('Sem DATABASE_URL. Usando banco em memória (fallback).');
}

const db = {
    async execute(sql, params = []) {
        if (!pool) {
            return await fallbackDb.execute(sql, params);
        }
        
        let pgSql = sql;
        let index = 1;
        while (pgSql.includes('?')) {
            pgSql = pgSql.replace('?', `$${index++}`);
        }
        
        try {
            const { rows } = await pool.query(pgSql, params);
            return rows;
        } catch (error) {
            console.error('Erro na query (Postgres):', error);
            // Fallback para memória em caso de erro na query também
            return await fallbackDb.execute(sql, params);
        }
    },
    
    async fetch(sql, params = []) {
        const rows = await this.execute(sql, params);
        return Array.isArray(rows) ? rows[0] || null : rows;
    },

    async fetchAll(sql, params = []) {
        return await this.execute(sql, params);
    }
};

module.exports = db;
