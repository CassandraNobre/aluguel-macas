const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const requiredProductionVariables = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'];

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

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function valueToSql(value) {
        if (value === null || value === undefined) return 'NULL';
        if (typeof value === 'number') return String(value);
        if (typeof value === 'boolean') return value ? '1' : '0';
        if (value instanceof Date) return `'${value.toISOString()}'`;
        return `'${String(value).replace(/'/g, "''")}'`;
    }

    function normalizeString(value) {
        return typeof value === 'string' ? value : '';
    }

    async function execute(sql, params = []) {
        const normalizedSql = normalizeString(sql).trim();
        const args = Array.isArray(params) ? params : [params];

        if (!normalizedSql) {
            return [[], []];
        }

        if (normalizedSql.startsWith('CREATE TABLE') || normalizedSql.startsWith('CREATE DATABASE')) {
            return [[], []];
        }

        if (normalizedSql.startsWith('SELECT id FROM usuarios WHERE email = ?')) {
            const email = args[0];
            return [store.users.filter((user) => user.email === email).map(({ id }) => ({ id }))];
        }

        if (normalizedSql.startsWith('SELECT * FROM usuarios WHERE email = ? AND ativo = 1')) {
            const email = args[0];
            return [store.users.filter((user) => user.email === email && user.ativo === 1)];
        }

        if (normalizedSql.includes('FROM auth_tokens t JOIN usuarios u ON u.id = t.usuario_id')) {
            const hash = args[0];
            const rows = store.authTokens
                .filter((token) => token.token_hash === hash && new Date(token.expires_at) > new Date())
                .map((token) => {
                    const user = store.users.find((entry) => entry.id === token.usuario_id && entry.ativo === 1);
                    if (!user) return null;
                    return { id: user.id, nome: user.nome, email: user.email };
                })
                .filter(Boolean);
            return [rows];
        }

        if (normalizedSql.includes('SELECT nome, tipo AS categoria, descricao, preco AS preco_por_hora FROM estacoes WHERE ativo = 1 ORDER BY nome')) {
            return [store.estacoes.filter((entry) => entry.ativo === 1).map((entry) => ({
                nome: entry.nome,
                categoria: entry.tipo,
                descricao: entry.descricao,
                preco_por_hora: Number(entry.preco),
            }))];
        }

        if (normalizedSql.includes('SELECT id, nome, tipo AS categoria, descricao, preco AS preco_por_hora,') && normalizedSql.includes('FROM estacoes')) {
            if (normalizedSql.includes('WHERE id = ? AND ativo = 1')) {
                const id = Number(args[0]);
                const row = store.estacoes.find((entry) => entry.id === id && entry.ativo === 1);
                return [row ? [row] : []];
            }
            return [store.estacoes.filter((entry) => entry.ativo === 1).map((entry) => ({
                id: entry.id,
                nome: entry.nome,
                categoria: entry.tipo,
                descricao: entry.descricao,
                preco_por_hora: Number(entry.preco),
                imagem_url: entry.imagem,
                recursos: entry.recursos,
                ativa: Boolean(entry.ativo),
                created_at: entry.criado_em,
                updated_at: entry.atualizado_em,
            }))];
        }

        if (normalizedSql.includes('r.entrada_data AS data')) {
            const userId = Number(args[0]);
            const rows = store.reservas
                .filter((reserva) => reserva.usuario_id === userId)
                .map((reserva) => {
                    const estacao = store.estacoes.find((entry) => entry.id === reserva.estacao_id);
                    const pagamento = store.pagamentos.find((entry) => entry.reserva_id === reserva.id);
                    const duracao = ((new Date(`1970-01-01T${reserva.saida_hora}`) - new Date(`1970-01-01T${reserva.entrada_hora}`)) / 60000) / 60;
                    return {
                        id: reserva.id,
                        usuario_id: reserva.usuario_id,
                        nome_cliente: reserva.nome_cliente || '',
                        estacao_id: reserva.estacao_id,
                        data: reserva.entrada_data,
                        horario_inicio: reserva.entrada_hora,
                        horario_fim: reserva.saida_hora,
                        duracao,
                        valor_total: Number((duracao * Number(estacao?.preco || 0)).toFixed(2)),
                        status: reserva.status,
                        observacoes: reserva.observacoes,
                        forma_pagamento: reserva.forma_pagamento || 'PIX',
                        pagamento_status: pagamento?.status || null,
                        created_at: reserva.criado_em,
                        updated_at: reserva.atualizado_em,
                        estacao_nome: estacao?.nome || `Estação ${reserva.estacao_id}`,
                    };
                });
            return [rows];
        }

        if (normalizedSql.startsWith('INSERT INTO usuarios')) {
            const [nome, email, hash] = args;
            const id = ++store.counters.users;
            const user = {
                id,
                nome,
                email,
                senha_hash: hash,
                telefone: null,
                tipo_usuario: 'tatuador',
                google_id: null,
                ativo: 1,
                email_verificado: 1,
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString(),
            };
            store.users.push(user);
            return [{ insertId: id, affectedRows: 1 }];
        }

        if (normalizedSql.startsWith('INSERT INTO auth_tokens')) {
            const [usuarioId, tokenHash, expiresAt] = args;
            const id = ++store.counters.tokens;
            store.authTokens.push({
                id,
                usuario_id: usuarioId,
                token_hash: tokenHash,
                expires_at: expiresAt,
                created_at: new Date().toISOString(),
            });
            return [{ insertId: id, affectedRows: 1 }];
        }

        if (normalizedSql.includes('INSERT INTO reservas')) {
            const comNomeCliente = normalizedSql.includes('nome_cliente');
            const [usuarioId, nomeCliente, estacaoId, entradaData, entradaHora, saidaData, saidaHora, observacoes, formaPagamento] = comNomeCliente
                ? args
                : [args[0], '', args[1], args[2], args[3], args[4], args[5], args[6], 'PIX'];
            const status = comNomeCliente ? undefined : args[7];
            const reservationId = ++store.counters.reservas;
            const reserva = {
                id: reservationId,
                usuario_id: Number(usuarioId),
                nome_cliente: nomeCliente || '',
                estacao_id: Number(estacaoId),
                entrada_data: entradaData,
                entrada_hora: entradaHora,
                saida_data: saidaData,
                saida_hora: saidaHora,
                observacoes: observacoes || '',
                forma_pagamento: formaPagamento || 'PIX',
                status: status || 'CONFIRMADA',
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString(),
            };
            store.reservas.push(reserva);
            return [{ insertId: reservationId, affectedRows: 1 }];
        }

        if (normalizedSql.includes('INSERT INTO pagamentos')) {
            const [reservaId, formaPagamentoPagto, valor] = args;
            const id = ++store.counters.pagamentos;
            store.pagamentos.push({
                id,
                reserva_id: Number(reservaId),
                forma_pagamento: formaPagamentoPagto,
                valor: Number(valor),
                status: 'PENDENTE',
                pago_em: null,
            });
            return [{ insertId: id, affectedRows: 1 }];
        }

        if (normalizedSql.includes("UPDATE pagamentos SET status = 'PAGO'")) {
            const [reservaId] = args;
            let affected = 0;
            store.pagamentos = store.pagamentos.map((pagamento) => {
                if (pagamento.reserva_id === Number(reservaId)) {
                    affected += 1;
                    return { ...pagamento, status: 'PAGO', pago_em: new Date().toISOString() };
                }
                return pagamento;
            });
            return [{ affectedRows: affected }];
        }

        if (normalizedSql.includes("SELECT status FROM pagamentos WHERE reserva_id = ? AND status = 'PAGO'")) {
            const [reservaId] = args;
            const rows = store.pagamentos.filter((pagamento) => pagamento.reserva_id === Number(reservaId) && pagamento.status === 'PAGO');
            return [rows];
        }

        if (normalizedSql.includes('SELECT id FROM reservas WHERE id = ? AND usuario_id = ?')) {
            const [id, usuarioId] = args;
            const rows = store.reservas.filter((reserva) => reserva.id === Number(id) && reserva.usuario_id === Number(usuarioId)).map(({ id }) => ({ id }));
            return [rows];
        }

        if (normalizedSql.includes('SELECT id FROM reservas WHERE estacao_id = ? AND entrada_data = ?')) {
            const [estacaoId, data, horarioFim, horarioInicio] = args;
            const rows = store.reservas.filter((reserva) => {
                const mesmaEstacao = reserva.estacao_id === Number(estacaoId) && reserva.entrada_data === data && ['CONFIRMADA', 'PENDENTE'].includes(reserva.status);
                if (!mesmaEstacao) return false;
                const inicioAtual = new Date(`1970-01-01T${reserva.entrada_hora}`);
                const fimAtual = new Date(`1970-01-01T${reserva.saida_hora}`);
                const inicioNovo = new Date(`1970-01-01T${horarioInicio}`);
                const fimNovo = new Date(`1970-01-01T${horarioFim}`);
                return inicioAtual < fimNovo && fimAtual > inicioNovo;
            }).map(({ id }) => ({ id }));
            return [rows];
        }

        if (normalizedSql.includes('SELECT entrada_hora AS horario_inicio, saida_hora AS horario_fim')) {
            const [estacaoId, data] = args;
            const rows = store.reservas
                .filter((reserva) => reserva.estacao_id === Number(estacaoId) && reserva.entrada_data === data && ['CONFIRMADA', 'PENDENTE'].includes(reserva.status))
                .sort((a, b) => a.entrada_hora.localeCompare(b.entrada_hora))
                .map(({ entrada_hora, saida_hora }) => ({ horario_inicio: entrada_hora, horario_fim: saida_hora }));
            return [rows];
        }

        if (normalizedSql.includes('UPDATE reservas SET status =')) {
            const [id, usuarioId] = args;
            let affected = 0;
            store.reservas = store.reservas.map((reserva) => {
                if (reserva.id === Number(id) && reserva.usuario_id === Number(usuarioId) && ['CONFIRMADA', 'PENDENTE'].includes(reserva.status)) {
                    affected += 1;
                    return { ...reserva, status: 'CANCELADA', atualizado_em: new Date().toISOString() };
                }
                return reserva;
            });
            return [{ affectedRows: affected }];
        }

        if (normalizedSql.includes('DELETE FROM reservas WHERE id = ? AND usuario_id = ?')) {
            const [id, usuarioId] = args;
            const antes = store.reservas.length;
            store.reservas = store.reservas.filter((reserva) => !(reserva.id === Number(id) && reserva.usuario_id === Number(usuarioId)));
            return [{ affectedRows: antes - store.reservas.length }];
        }

        if (normalizedSql.includes('SELECT id, preco FROM estacoes WHERE id = ? AND ativo = 1')) {
            const id = Number(args[0]);
            const row = store.estacoes.find((entry) => entry.id === id && entry.ativo === 1);
            return [row ? [row] : []];
        }

        return [[], []];
    }

    async function getConnection() {
        return {
            async execute(sql, params = []) { return execute(sql, params); },
            async beginTransaction() { return true; },
            async commit() { return true; },
            async rollback() { return true; },
            release() { return true; },
        };
    }

    return {
        execute,
        getConnection,
        __fallback: true,
    };
}

const sslEnabled = /^true$/i.test(process.env.DB_SSL || '');

let mysqlConfig = {};

if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    mysqlConfig = {
        host: url.hostname,
        port: Number(url.port || 3306),
        user: url.username,
        password: url.password,
        database: url.pathname.replace('/', ''),
        waitForConnections: true,
        connectionLimit: 10,
        ...(sslEnabled || url.searchParams.get('ssl-mode') === 'REQUIRED' ? { ssl: { rejectUnauthorized: false } } : {}),
    };
} else {
    mysqlConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS ?? '',
        database: process.env.DB_NAME || 'inkstation',
        waitForConnections: true,
        connectionLimit: 10,
        ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
    };
}

const fallbackDb = createFallbackDatabase();
let pool = null;

function isMysqlConfigured() {
    return Boolean(process.env.DATABASE_URL || process.env.DB_HOST || process.env.DB_USER || process.env.DB_NAME || process.env.DB_PORT);
}

try {
    if (isMysqlConfigured() || isProduction) {
        pool = mysql.createPool(mysqlConfig);
        pool.getConnection = pool.getConnection || (() => mysql.createPool(mysqlConfig).getConnection());
    }
} catch (error) {
    console.warn('MySQL indisponível, usando banco em memória:', error.message || error);
}

const db = {
    async execute(sql, params = []) {
        if (!pool) {
            return fallbackDb.execute(sql, params);
        }

        try {
            return await pool.execute(sql, params);
        } catch (error) {
            const message = String(error?.message || error || '');
            if (/Access denied|ECONNREFUSED|connect/i.test(message) || /Unknown database|Unknown MySQL/i.test(message)) {
                console.warn('MySQL falhou na conexão. Ativando banco em memória para manter a aplicação funcionando localmente.', message);
                return fallbackDb.execute(sql, params);
            }
            throw error;
        }
    },
    async getConnection() {
        if (!pool) {
            return fallbackDb.getConnection();
        }

        try {
            return await pool.getConnection();
        } catch (error) {
            const message = String(error?.message || error || '');
            if (/Access denied|ECONNREFUSED|connect/i.test(message) || /Unknown database|Unknown MySQL/i.test(message)) {
                console.warn('MySQL indisponível para transações. Usando fallback em memória.', message);
                return fallbackDb.getConnection();
            }
            throw error;
        }
    },
    __fallback: !pool,
};

if (isProduction) {
    const missingVariables = requiredProductionVariables.filter((name) => !process.env[name]);
    if (missingVariables.length) {
        console.warn(`Variáveis de banco ausentes no ambiente de produção: ${missingVariables.join(', ')}. Usando fallback em memória.`);
    }
}

module.exports = db;