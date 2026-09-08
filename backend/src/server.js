const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const db = require('./config/database');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const api = express.Router();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

function resposta(res, status, message, data = {}, errors = {}) {
    return res.status(status).json({ success: status < 400, status, message, data, errors });
}

// ROTA DE LOGIN RESTAURADA
api.post('/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) return resposta(res, 400, 'E-mail e senha são obrigatórios');

        const rows = await db.execute('SELECT * FROM usuarios WHERE email = ? AND ativo = true', [email]);
        if (!rows.length || !(await bcrypt.compare(senha, rows[0].senha_hash))) {
            return resposta(res, 401, 'E-mail ou senha inválidos');
        }

        return resposta(res, 200, 'Login realizado com sucesso', {
            token: 'mock-token',
            user: { id: rows[0].id, nome: rows[0].nome, email: rows[0].email }
        });
    } catch (error) {
        console.error(error);
        return resposta(res, 500, 'Erro interno do servidor');
    }
});

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

app.use(['/api', '/inkstation-api/api'], api);
app.listen(PORT, HOST, () => console.log(`Servidor rodando em http://${HOST}:${PORT}/api`));
