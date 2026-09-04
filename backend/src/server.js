const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const db = require('./config/database');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const api = express.Router();
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;
const originsPermitidas = new Set([
    'http://localhost:4200',
    'https://aluguel-macas.vercel.app',
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim()) : [])
]);

async function prepararTabelaDeTokens() {
    await db.execute(`CREATE TABLE IF NOT EXISTS auth_tokens (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_auth_tokens_usuario (usuario_id),
        CONSTRAINT fk_auth_tokens_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

function recursosDaEstacao(valor) {
    if (Array.isArray(valor)) return valor;
    if (!valor) return [];
    try {
        return JSON.parse(valor);
    } catch {
        return [];
    }
}

function minutosDoHorario(horario) {
    const valor = String(horario ?? '').trim();
    const partes = valor.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!partes) return NaN;
    const horas = Number(partes[1]);
    const minutos = Number(partes[2]);
    const segundos = Number(partes[3] || 0);
    return horas <= 23 && minutos <= 59 && segundos <= 59 ? horas * 60 + minutos : NaN;
}

function horarioNormalizado(horario) {
    const valor = String(horario ?? '').trim();
    const partes = valor.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!partes) return null;
    const horas = Number(partes[1]);
    const minutos = Number(partes[2]);
    const segundos = Number(partes[3] || 0);
    if (horas > 23 || minutos > 59 || segundos > 59) return null;
    return `${partes[1]}:${partes[2]}:${String(segundos).padStart(2, '0')}`;
}

function dataValida(data) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
    const [ano, mes, dia] = data.split('-').map(Number);
    const valor = new Date(Date.UTC(ano, mes - 1, dia));
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return valor.getUTCFullYear() === ano && valor.getUTCMonth() === mes - 1 && valor.getUTCDate() === dia && valor >= new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
}

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

async function respostaDaIA(message) {
    const [stations] = await db.execute(
        'SELECT nome, tipo AS categoria, descricao, preco AS preco_por_hora FROM estacoes WHERE ativo = 1 ORDER BY nome'
    );
    const context = stations.map((station) =>
        `${station.nome} (${station.categoria || 'Geral'}): R$ ${Number(station.preco_por_hora).toFixed(2)}/hora - ${station.descricao || ''}`
    ).join('\n');
    const prompt = `Você é o assistente do InkStation, um estúdio de tatuagem. Responda em português, de forma objetiva e amigável.\nEstações ativas:\n${context || 'Nenhuma estação cadastrada.'}\nPergunta: ${message}`;

    if (process.env.OPENAI_API_KEY) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                messages: [{ role: 'system', content: prompt }, { role: 'user', content: message }],
                temperature: 0.4
            })
        });
        if (!response.ok) throw new Error(`OpenAI retornou HTTP ${response.status}`);
        const payload = await response.json();
        return payload.choices?.[0]?.message?.content?.trim() || 'Não consegui gerar uma resposta.';
    }

    if (process.env.GEMINI_API_KEY) {
        const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }
        );
        if (!response.ok) throw new Error(`Gemini retornou HTTP ${response.status}`);
        const payload = await response.json();
        return payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Não consegui gerar uma resposta.';
    }

    return stations.length
        ? `Temos ${stations.length} estação(ões) ativa(s): ${stations.map((station) => station.nome).join(', ')}.`
        : 'No momento não há estações cadastradas.';
}

function resposta(res, status, message, data = {}, errors = {}) {
    return res.status(status).json({ success: status < 400, status, message, data, errors });
}

function tokenDoHeader(req) {
    const header = req.get('Authorization') || '';
    return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

async function autenticado(req, res, next) {
    const token = tokenDoHeader(req);
    if (!token) return resposta(res, 401, 'Token de autenticação obrigatório');

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await db.execute(
        `SELECT u.id, u.nome, u.email
         FROM auth_tokens t JOIN usuarios u ON u.id = t.usuario_id
         WHERE t.token_hash = ? AND t.expires_at > NOW() AND u.ativo = 1`,
        [hash]
    );
    if (!rows.length) return resposta(res, 401, 'Token inválido ou expirado');
    req.usuario = rows[0];
    req.tokenHash = hash;
    next();
}

api.post('/auth/register', async (req, res) => {
    try {
        const { nome_artistico, nome, email, senha, confirmar_senha } = req.body;
        const nomeFinal = nome_artistico || nome;
        
        // Validação: campos obrigatórios
        if (!nomeFinal || !email || !senha) {
            return resposta(res, 400, 'Nome, e-mail e senha são obrigatórios');
        }
        
        // Validação: email válido
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return resposta(res, 400, 'E-mail inválido');
        }
        
        // Validação: confirmação de senha
        if (confirmar_senha !== undefined && senha !== confirmar_senha) {
            return resposta(res, 400, 'As senhas não conferem');
        }
        
        // Validação: comprimento mínimo de senha
        if (senha.length < 8) {
            return resposta(res, 400, 'A senha deve ter pelo menos 8 caracteres');
        }

        // Verificação: email não duplicado
        const [existing] = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existing.length) {
            return resposta(res, 409, 'Este e-mail já está cadastrado');
        }

        // Criptografia: hash da senha
        const hash = await bcrypt.hash(senha, 12);
        
        // Inserção: novo usuário
        const [result] = await db.execute(
            'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
            [nomeFinal, email, hash]
        );
        
        // Validação: verificar se inserção foi bem-sucedida
        if (!result.insertId) {
            console.error('Falha ao inserir usuário:', result);
            return resposta(res, 500, 'Erro ao cadastrar usuário');
        }
        
        return resposta(res, 201, 'Usuário cadastrado com sucesso', {
            id: result.insertId,
            nome_artistico: nomeFinal,
            nome: nomeFinal,
            email
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        
        // Tratamento específico de erros
        if (error.code === 'ER_DUP_ENTRY') {
            return resposta(res, 409, 'Este e-mail já está cadastrado');
        }
        
        return resposta(res, 500, 'Erro interno do servidor');
    }
});

async function gerarTokenSessao(usuarioId) {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await db.execute(
        `INSERT INTO auth_tokens (usuario_id, token_hash, expires_at)
         VALUES (?, ?, ?)`,
        [usuarioId, hash, expiresAt.toISOString()]
    );
    return token;
}

api.post('/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Validação: email e senha obrigatórios
        if (!email || !senha) {
            return resposta(res, 400, 'E-mail e senha são obrigatórios');
        }

        const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ? AND ativo = 1', [email]);

        // Validação: usuário existe
        if (!rows.length) {
            return resposta(res, 401, 'E-mail ou senha inválidos');
        }

        // Validação: senha correta (verificar ANTES de acessar rows[0])
        const senhaValida = await bcrypt.compare(senha, rows[0].senha_hash);
        if (!senhaValida) {
            return resposta(res, 401, 'E-mail ou senha inválidos');
        }

        const token = await gerarTokenSessao(rows[0].id);
        return resposta(res, 200, 'Login realizado com sucesso', {
            token,
            user: { id: rows[0].id, nome_artistico: rows[0].nome, nome: rows[0].nome, email: rows[0].email }
        });
    } catch (error) {
        console.error(error);
        return resposta(res, 500, 'Erro interno do servidor');
    }
});

api.post('/auth/google', async (req, res) => {
    if (!googleClient) {
        return resposta(res, 500, 'Login com Google não está configurado no servidor');
    }

    try {
        const { credential } = req.body;
        if (!credential) return resposta(res, 400, 'Credencial do Google é obrigatória');

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload?.email) return resposta(res, 401, 'Não foi possível validar a conta Google');

        const [existentes] = await db.execute('SELECT * FROM usuarios WHERE email = ? OR google_id = ?', [payload.email, payload.sub]);
        let usuario = existentes[0];

        if (!usuario) {
            const senhaAleatoria = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);
            const [result] = await db.execute(
                'INSERT INTO usuarios (nome, email, senha_hash, google_id, email_verificado) VALUES (?, ?, ?, ?, 1)',
                [payload.name || payload.email, payload.email, senhaAleatoria, payload.sub]
            );
            usuario = { id: result.insertId, nome: payload.name || payload.email, email: payload.email };
        } else if (!usuario.google_id) {
            await db.execute('UPDATE usuarios SET google_id = ? WHERE id = ?', [payload.sub, usuario.id]);
        }

        const token = await gerarTokenSessao(usuario.id);
        console.log('✅ LOGIN GOOGLE SUCESSO:', { usuarioId: usuario.id, email: usuario.email });
        return resposta(res, 200, 'Login com Google realizado com sucesso', {
            token,
            user: { id: usuario.id, nome_artistico: usuario.nome, nome: usuario.nome, email: usuario.email }
        });
    } catch (error) {
        console.error('Erro no login com Google:', error);
        return resposta(res, 401, 'Não foi possível validar a conta Google');
    }
});

api.get('/estacoes', async (req, res) => {
    try {
        const [rows] = await db.execute(
                `SELECT id, nome, tipo AS categoria, descricao, preco AS preco_por_hora,
                    imagem AS imagem_url, recursos, ativo AS ativa,
                    criado_em AS created_at, atualizado_em AS updated_at
             FROM estacoes
                 WHERE ativo = 1
             ORDER BY nome`
        );
        return resposta(res, 200, 'Estações carregadas', rows.map((row) => ({
            ...row,
            preco_por_hora: Number(row.preco_por_hora),
            recursos: recursosDaEstacao(row.recursos),
            ativa: Boolean(row.ativa)
        })));
    } catch (error) {
        console.error(error);
        return resposta(res, 500, 'Erro interno do servidor');
    }
});

api.get('/estacoes/:id', async (req, res) => {
    try {
        const [rows] = await db.execute(
                `SELECT id, nome, tipo AS categoria, descricao, preco AS preco_por_hora,
                    imagem AS imagem_url, recursos, ativo AS ativa,
                    criado_em AS created_at, atualizado_em AS updated_at
                 FROM estacoes WHERE id = ? AND ativo = 1`,
            [req.params.id]
        );
        if (!rows.length) return resposta(res, 404, 'Estação não encontrada');
        const estacao = rows[0];
        return resposta(res, 200, 'Estação carregada', {
            ...estacao,
            preco_por_hora: Number(estacao.preco_por_hora),
            recursos: recursosDaEstacao(estacao.recursos),
            ativa: Boolean(estacao.ativa)
        });
    } catch (error) {
        console.error(error);
        return resposta(res, 500, 'Erro interno do servidor');
    }
});

api.get('/estacoes/:id/horarios', async (req, res) => {
    const estacaoId = Number(req.params.id);
    const data = req.query.data;

    if (!Number.isInteger(estacaoId) || estacaoId <= 0 || !dataValida(data)) {
        return resposta(res, 400, 'Informe uma estação e data válidas');
    }

    try {
        const [rows] = await db.execute(
            `SELECT entrada_hora AS horario_inicio, saida_hora AS horario_fim
             FROM reservas
             WHERE estacao_id = ? AND entrada_data = ? AND status IN ('CONFIRMADA', 'PENDENTE')
             ORDER BY entrada_hora`,
            [estacaoId, data]
        );
        return resposta(res, 200, 'Horários ocupados carregados', rows);
    } catch (error) {
        console.error(error);
        return resposta(res, 500, 'Erro interno do servidor');
    }
});

api.get('/reservas', autenticado, async (req, res) => {
    try {
        const [rows] = await db.execute(
                `SELECT r.id, r.usuario_id, r.estacao_id, r.entrada_data AS data,
                    r.entrada_hora AS horario_inicio, r.saida_hora AS horario_fim,
                    ROUND(TIMESTAMPDIFF(MINUTE, CONCAT(r.entrada_data, ' ', r.entrada_hora),
                        CONCAT(r.saida_data, ' ', r.saida_hora)) / 60, 2) AS duracao,
                    ROUND(TIMESTAMPDIFF(MINUTE, CONCAT(r.entrada_data, ' ', r.entrada_hora),
                        CONCAT(r.saida_data, ' ', r.saida_hora)) / 60 * e.preco, 2) AS valor_total,
                    r.status, r.observacoes, r.criado_em AS created_at,
                    r.atualizado_em AS updated_at,
                    e.nome AS estacao_nome
             FROM reservas r JOIN estacoes e ON e.id = r.estacao_id
             WHERE r.usuario_id = ? ORDER BY r.entrada_data DESC, r.entrada_hora DESC`,
            [req.usuario.id]
        );
        return resposta(res, 200, 'Reservas carregadas', rows);
    } catch (error) {
        console.error(error);
        return resposta(res, 500, 'Erro interno do servidor');
    }
});

api.post('/reservas', autenticado, async (req, res) => {
    const { estacao_id, data, horario_inicio, horario_fim, observacoes = '' } = req.body;
    const estacaoId = Number(estacao_id);
    const horarioInicio = horarioNormalizado(horario_inicio);
    const horarioFim = horarioNormalizado(horario_fim);
    const inicio = minutosDoHorario(horarioInicio);
    const fim = minutosDoHorario(horarioFim);
    if (!Number.isInteger(estacaoId) || estacaoId <= 0 || !dataValida(data) || !Number.isFinite(inicio) || !Number.isFinite(fim) || inicio >= fim) {
        return resposta(res, 400, 'Estação, data e horários válidos são obrigatórios');
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [stations] = await connection.execute(
            'SELECT id, preco FROM estacoes WHERE id = ? AND ativo = 1 FOR UPDATE', [estacaoId]
        );
        if (!stations.length) {
            await connection.rollback();
            return resposta(res, 404, 'Estação não encontrada ou inativa');
        }
        const [conflicts] = await connection.execute(
            `SELECT id FROM reservas WHERE estacao_id = ? AND entrada_data = ?
             AND status IN ('CONFIRMADA', 'PENDENTE')
             AND entrada_hora < ? AND saida_hora > ? FOR UPDATE`,
            [estacaoId, data, horarioFim, horarioInicio]
        );
        if (conflicts.length) {
            await connection.rollback();
            return resposta(res, 409, 'Horário já está reservado');
        }
        const duration = (fim - inicio) / 60;
        const total = Number((duration * Number(stations[0].preco)).toFixed(2));
        const [result] = await connection.execute(
            `INSERT INTO reservas
                (usuario_id, estacao_id, entrada_data, entrada_hora, saida_data, saida_hora, observacoes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMADA')`,
            [req.usuario.id, estacaoId, data, horarioInicio, data, horarioFim, observacoes]
        );
        await connection.commit();
        return resposta(res, 201, 'Reserva criada com sucesso', { id: result.insertId, estacao_id: estacaoId, data, horario_inicio: horarioInicio, horario_fim: horarioFim, duracao: duration, valor_total: total, status: 'confirmada' });
    } catch (error) {
        if (connection) await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') return resposta(res, 409, 'Horário já está reservado');
        console.error(error);
        return resposta(res, 500, 'Erro interno do servidor');
    } finally {
        if (connection) connection.release();
    }
});

api.patch('/reservas/:id/cancelar', autenticado, async (req, res) => {
    try {
        const [result] = await db.execute(
            `UPDATE reservas SET status = 'CANCELADA' WHERE id = ? AND usuario_id = ? AND status IN ('CONFIRMADA', 'PENDENTE')`,
            [req.params.id, req.usuario.id]
        );
        if (!result.affectedRows) return resposta(res, 404, 'Reserva não encontrada ou não pode ser cancelada');
        return resposta(res, 200, 'Reserva cancelada com sucesso', { id: Number(req.params.id), status: 'cancelada' });
    } catch (error) {
        console.error(error);
        return resposta(res, 500, 'Erro interno do servidor');
    }
});

api.delete('/reservas/:id', autenticado, async (req, res) => {
    try {
        const [result] = await db.execute(
            `DELETE FROM reservas WHERE id = ? AND usuario_id = ?`,
            [req.params.id, req.usuario.id]
        );
        if (!result.affectedRows) return resposta(res, 404, 'Reserva não encontrada');
        return resposta(res, 200, 'Reserva apagada com sucesso', { id: Number(req.params.id) });
    } catch (error) {
        console.error(error);
        return resposta(res, 500, 'Erro interno do servidor');
    }
});

api.post('/chatbot', async (req, res) => {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) return resposta(res, 400, 'A mensagem é obrigatória');

    try {
        const messageResponse = await respostaDaIA(message);
        return resposta(res, 200, 'Resposta gerada com sucesso.', { message: messageResponse });
    } catch (error) {
        console.error(error);
        return resposta(res, 502, 'Não foi possível gerar a resposta do chatbot');
    }
});

app.get('/', (req, res) => resposta(res, 200, 'InkStation API funcionando'));
app.get('/health', (req, res) => resposta(res, 200, 'OK', { service: 'inkstation-api' }));
app.use(['/api', '/inkstation-api/api'], api);

prepararTabelaDeTokens()
    .then(() => app.listen(PORT, HOST, () => console.log(`Servidor rodando em http://${HOST}:${PORT}/api`)))
    .catch((error) => {
        console.error('Não foi possível preparar o banco:', error);
        process.exit(1);
    });