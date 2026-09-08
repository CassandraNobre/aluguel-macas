const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./config/database');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const api = express.Router();

const originsPermitidas = new Set([
    'http://localhost:4200',
    'https://aluguel-macas.vercel.app',
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim()) : [])
]);

app.use(express.json());
app.use((req, res, next) => {
    const origin = req.get('Origin');
    if (origin && originsPermitidas.has(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Vary', 'Origin');
    }
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

function resposta(res, status, message, data = {}, errors = {}) {
    return res.status(status).json({ success: status < 400, status, message, data, errors });
}

api.get('/estacoes', async (req, res) => {
    try {
        const rows = await db.execute(
            `SELECT id, nome, tipo AS categoria, descricao, preco, imagem AS imagem_url, recursos, ativo AS ativa FROM estacoes WHERE ativo = true ORDER BY nome`
        );
        return resposta(res, 200, 'Estações carregadas', rows.map(row => ({ ...row, preco_por_hora: Number(row.preco) })));
    } catch (error) {
        console.error(error);
        return resposta(res, 500, 'Erro interno do servidor');
    }
});

app.get('/', (req, res) => resposta(res, 200, 'InkStation API funcionando'));
app.get('/health', (req, res) => resposta(res, 200, 'OK', { service: 'inkstation-api' }));
app.use(['/api', '/inkstation-api/api'], api);

app.listen(PORT, HOST, () => console.log(`Servidor rodando em http://${HOST}:${PORT}/api`));
