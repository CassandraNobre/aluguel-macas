const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

function createFallbackDatabase() {
    const store = {
        users: [{
            id: 1,
            nome: 'Artista Silva',
            email: 'artista@example.com',
            senha_hash: bcrypt.hashSync('senha123456', 12),
            telefone: null,
            tipo_usuario: 'tatuador',
            google_id: null,
            ativo: 1,
            email_verificado: 1,
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString(),
        }],
        estacoes: [
            { id: 1, nome: 'Estação Premium 01', tipo: 'Premium', descricao: 'Estação premium', preco: 35, imagem: 'https://example.com/estacao-premium-01.jpg', recursos: '[]', ativo: 1 },
            { id: 2, nome: 'Estação Premium 02', tipo: 'Premium', descricao: 'Estação premium', preco: 35, imagem: 'https://example.com/estacao-premium-02.jpg', recursos: '[]', ativo: 1 },
            { id: 3, nome: 'Estação Padrão 01', tipo: 'Padrão', descricao: 'Estação padrão', preco: 20, imagem: 'https://example.com/estacao-padrao-01.jpg', recursos: '[]', ativo: 1 },
            { id: 4, nome: 'Estação Padrão 02', tipo: 'Padrão', descricao: 'Estação padrão', preco: 20, imagem: 'https://example.com/estacao-padrao-02.jpg', recursos: '[]', ativo: 1 }
        ],
        reservas: [],
        authTokens: [],
        pagamentos: [],
        counters: { users: 1, estacoes: 4, reservas: 0, tokens: 0, pagamentos: 0 },
    };

    async function execute(sql, params = []) {
        if (sql.includes('SELECT') || sql.includes('FROM estacoes')) return store.estacoes;
        return [];
    }

    return {
        execute,
        async getConnection() { return { async release() {} }; }
    };
}

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
