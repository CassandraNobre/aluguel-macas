const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

function createFallbackDatabase() {
    const store = {
        users: [
            {
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
            },
        ],
        estacoes: [
            {
                id: 1,
                nome: 'Estação Premium 01',
                tipo: 'Premium',
                descricao: 'Estação premium com iluminação profissional',
                preco: 35,
                imagem: 'https://example.com/estacao-premium-01.jpg',
                recursos: '["Cadeira ergonômica","Iluminação LED","Espelho 180°","Esterilizador","Ar condicionado"]',
                ativo: 1,
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString(),
            },
            {
                id: 2,
                nome: 'Estação Premium 02',
                tipo: 'Premium',
                descricao: 'Estação premium com iluminação profissional',
                preco: 35,
                imagem: 'https://example.com/estacao-premium-02.jpg',
                recursos: '["Cadeira ergonômica","Iluminação LED","Espelho 180°","Esterilizador","Ar condicionado"]',
                ativo: 1,
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString(),
            },
            {
                id: 3,
                nome: 'Estação Padrão 01',
                tipo: 'Padrão',
                descricao: 'Estação de trabalho padrão bem equipada',
                preco: 20,
                imagem: 'https://example.com/estacao-padrao-01.jpg',
                recursos: '["Cadeira confortável","Iluminação boa","Espelho","Ar condicionado"]',
                ativo: 1,
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString(),
            },
            {
                id: 4,
                nome: 'Estação Padrão 02',
                tipo: 'Padrão',
                descricao: 'Estação de trabalho padrão bem equipada',
                preco: 20,
                imagem: 'https://example.com/estacao-padrao-02.jpg',
                recursos: '["Cadeira confortável","Iluminação boa","Espelho","Ar condicionado"]',
                ativo: 1,
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString(),
            },
        ],
        reservas: [
            {
                id: 1,
                usuario_id: 1,
                estacao_id: 1,
                entrada_data: '2026-08-25',
                entrada_hora: '09:00:00',
                saida_data: '2026-08-25',
                saida_hora: '13:00:00',
                observacoes: 'Sessão de realismo',
                status: 'CONFIRMADA',
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString(),
            },
        ],
        authTokens: [],
        pagamentos: [],
        counters: { users: 1, estacoes: 4, reservas: 1, tokens: 0, pagamentos: 0 },
    };

    async function execute(sql, params = []) {
        // Mock simples para manter o app rodando localmente
        if (sql.includes('SELECT')) return store.estacoes;
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
