require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./config/database');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const api = express.Router();
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, callback) => callback(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
});

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d', immutable: true }));

function resposta(res, status, message, data = {}, errors = {}) {
  return res.status(status).json({ success: status < 400, status, message, data, errors });
}

function imagemPublica(req, imagem) {
  if (!imagem) return '';
  const valor = String(imagem).trim();
  const nome = valor.split(/[\\/]/).pop();
  if (!nome) return '';
  return `${req.protocol}://${req.get('host')}/uploads/${nome}`;
}

// REGISTRO
api.post('/auth/register', async (req, res) => {
  try {
    const { nome, nome_artistico, email, senha, confirmar_senha } = req.body;
    const nomeFinal = nome || nome_artistico;

    if (!nomeFinal || !email || !senha) return resposta(res, 400, 'Dados incompletos');
    if (senha !== confirmar_senha) return resposta(res, 400, 'As senhas não conferem');

    const hash = await bcrypt.hash(senha, 5);
    await db.execute('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)', [nomeFinal, email, hash]);
    return resposta(res, 201, 'Usuário cadastrado com sucesso');
  } catch (error) {
    if (error.code === '23505') {
      return resposta(res, 409, 'Este e-mail ou nome já está cadastrado');
    }
    console.error('Erro no registro:', error);
    return resposta(res, 500, 'Erro no registro');
  }
});

// LOGIN
api.post('/auth/login', async (req, res) => {
  try {
    const { email, login, senha } = req.body;
    const identificador = email || login;

    if (!identificador || !senha) {
      return resposta(res, 400, 'Informe o e-mail/nome e a senha');
    }

    const rows = await db.execute(
      'SELECT * FROM usuarios WHERE email = ? OR nome = ?',
      [identificador, identificador]
    );

    if (!rows.length || !(await bcrypt.compare(senha, rows[0].senha_hash))) {
      return resposta(res, 401, 'Credenciais inválidas');
    }

    return resposta(res, 200, 'Login realizado', {
      token: 'mock-token',
      user: { id: rows[0].id, nome: rows[0].nome, email: rows[0].email },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return resposta(res, 500, 'Erro no login');
  }
});

// REDEFINIR SENHA DIRETA (Único Passo)
api.post('/auth/redefinir-senha', async (req, res) => {
  try {
    const { identificador, email, nova_senha, confirmar_senha } = req.body;
    const busca = identificador || email;

    if (!busca || !nova_senha) return resposta(res, 400, 'Preencha o e-mail/nome e a nova senha');
    if (nova_senha !== confirmar_senha) return resposta(res, 400, 'As senhas não conferem');
    if (nova_senha.length < 8) return resposta(res, 400, 'A senha deve ter no mínimo 8 caracteres');

    const rows = await db.execute('SELECT id FROM usuarios WHERE email = ? OR nome = ?', [busca, busca]);
    if (!rows.length) {
      return resposta(res, 404, 'Conta não encontrada com esse e-mail ou nome');
    }

    const hash = await bcrypt.hash(nova_senha, 10);
    await db.execute('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [hash, rows[0].id]);

    return resposta(res, 200, 'Senha alterada com sucesso! Faça login com a nova senha.');
  } catch (error) {
    console.error('Erro no redefinir-senha:', error);
    return resposta(res, 500, 'Erro ao redefinir senha');
  }
});

// ESTAÇÕES E RESERVAS
api.post('/chatbot', async (req, res) => {
  return resposta(res, 410, 'O chatbot é executado diretamente no frontend.');
  const pergunta = String(req.body?.message || '').trim().toLowerCase();
  if (!pergunta) return resposta(res, 400, 'Digite uma mensagem');
  try {
    const history = historicoSeguro(req.body?.history);
    const message = chatbotConfig.flowiseUrl && chatbotConfig.flowiseChatflowId
      ? await responderComFlowise(pergunta, history)
      : await responderComOllama(pergunta, history);
    return resposta(res, 200, 'Resposta do assistente', { message });
  } catch (error) {
    console.error('Erro no chatbot:', error.message);
    return resposta(res, 503, 'Chatbot indisponível. Inicie o Ollama ou configure o Flowise.');
  }
  let mensagem = 'Posso ajudar com estacoes, horarios, reservas e pagamentos. O que voce deseja saber?';
  if (pergunta.includes('horário') || pergunta.includes('horario')) mensagem = 'Os horarios disponiveis aparecem no agendamento depois que voce escolhe a estacao, a data e a duracao da sessao.';
  else if (pergunta.includes('reserva') || pergunta.includes('agendar')) mensagem = 'Para reservar, acesse Estacoes, escolha uma estacao, selecione data e horario e confirme o agendamento.';
  else if (pergunta.includes('pagamento') || pergunta.includes('pix')) mensagem = 'As informacoes de pagamento aparecem apos a confirmacao da reserva. Voce tambem pode consultar Reservas pagas.';
  else if (pergunta.includes('estação') || pergunta.includes('estacao')) mensagem = 'Voce pode consultar as estacoes disponiveis no catalogo. Cada card mostra recursos e preco por hora.';
  else if (pergunta.includes('olá') || pergunta.includes('ola') || pergunta.includes('oi')) mensagem = 'Ola! Como posso ajudar com sua reserva hoje?';
  return resposta(res, 200, 'Resposta do assistente', { message: mensagem });
});

api.post('/estacoes', upload.single('imagem'), async (req, res) => {
  try {
    const { nome, categoria, descricao, preco_por_hora, recursos } = req.body || {};
    const preco = Number(preco_por_hora);
    if (!String(nome || '').trim() || !String(descricao || '').trim() || !Number.isFinite(preco) || preco <= 0) {
      return resposta(res, 400, 'Informe nome, descrição e um preço válido');
    }
    const recursosJson = JSON.stringify(String(recursos || '').split(',').map((item) => item.trim()).filter(Boolean));
    const imagemUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : '';
    const rows = await db.execute(
      `INSERT INTO estacoes (nome, tipo, descricao, preco, imagem, recursos, ativo)
       VALUES (?, ?, ?, ?, ?, ?, true)
       RETURNING id, nome, tipo AS categoria, descricao, preco, imagem AS imagem_url, recursos, ativo AS ativa`,
      [String(nome).trim(), String(categoria || '').trim(), String(descricao).trim(), preco, imagemUrl, recursosJson]
    );
    return resposta(res, 201, 'Estação cadastrada', { ...rows[0], imagem_url: imagemPublica(req, rows[0].imagem_url) });
  } catch (error) {
    console.error('Erro ao cadastrar estação:', error);
    return resposta(res, 500, 'Erro ao cadastrar estação');
  }
});

api.get('/estacoes', async (req, res) => {
  try {
    const rows = await db.execute(`SELECT id, nome, tipo AS categoria, descricao, preco, imagem AS imagem_url, recursos, ativo AS ativa FROM estacoes WHERE ativo = true ORDER BY nome`);
    return resposta(res, 200, 'Estações carregadas', rows.map((row) => ({ ...row, imagem_url: imagemPublica(req, row.imagem_url), preco_por_hora: Number(row.preco) })));
  } catch (error) {
    console.error(error);
    return resposta(res, 500, 'Erro interno');
  }
});

api.get('/estacoes/:id', async (req, res) => {
  try {
    const rows = await db.execute(
      `SELECT id, nome, tipo AS categoria, descricao, preco, imagem AS imagem_url, recursos, ativo AS ativa 
       FROM estacoes WHERE id = ? AND ativo = true`,
      [req.params.id]
    );
    if (!rows.length) return resposta(res, 404, 'Estação não encontrada');
    return resposta(res, 200, 'Estação carregada', { ...rows[0], imagem_url: imagemPublica(req, rows[0].imagem_url), preco_por_hora: Number(rows[0].preco) });
  } catch (error) {
    console.error(error);
    return resposta(res, 500, 'Erro interno');
  }
});

api.delete('/estacoes/:id', async (req, res) => {
  try {
    const rows = await db.execute('DELETE FROM estacoes WHERE id = ? RETURNING id', [req.params.id]);
    if (!rows.length) return resposta(res, 404, 'Estação não encontrada');
    return resposta(res, 200, 'Estação apagada');
  } catch (error) {
    if (error.code === '23503') return resposta(res, 409, 'Não é possível apagar uma estação que possui reservas vinculadas');
    console.error('Erro ao apagar estação:', error);
    return resposta(res, 500, 'Erro ao apagar estação');
  }
});

api.patch('/estacoes/:id', upload.single('imagem'), async (req, res) => {
  try {
    const { nome, categoria, descricao, preco_por_hora, recursos } = req.body || {};
    const preco = Number(preco_por_hora);
    if (!String(nome || '').trim() || !String(descricao || '').trim() || !Number.isFinite(preco) || preco <= 0) return resposta(res, 400, 'Dados inválidos');
    const recursosJson = JSON.stringify(String(recursos || '').split(',').map((item) => item.trim()).filter(Boolean));
    const imagemSql = req.file ? ', imagem = ?' : '';
    const params = [String(nome).trim(), String(categoria || '').trim(), String(descricao).trim(), preco, recursosJson];
    if (req.file) params.push(`${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`);
    params.push(req.params.id);
    const rows = await db.execute(`UPDATE estacoes SET nome = ?, tipo = ?, descricao = ?, preco = ?, recursos = ?${imagemSql} WHERE id = ? RETURNING id, nome, tipo AS categoria, descricao, preco, imagem AS imagem_url, recursos, ativo AS ativa`, params);
    if (!rows.length) return resposta(res, 404, 'Estação não encontrada');
    return resposta(res, 200, 'Estação atualizada', { ...rows[0], imagem_url: imagemPublica(req, rows[0].imagem_url) });
  } catch (error) {
    console.error('Erro ao atualizar estação:', error);
    return resposta(res, 500, 'Erro ao atualizar estação');
  }
});

api.get('/estacoes/:id/horarios', async (req, res) => {
  try {
    const rows = await db.execute(
      `SELECT entrada_hora AS horario_inicio, saida_hora AS horario_fim
       FROM reservas
       WHERE estacao_id = ? AND entrada_data = ? AND status = 'CONFIRMADA'`,
      [req.params.id, req.query.data]
    );
    return resposta(res, 200, 'Horários ocupados carregados', rows);
  } catch (error) {
    console.error(error);
    return resposta(res, 500, 'Erro interno');
  }
});

api.post('/reservas', async (req, res) => {
  try {
    const { estacao_id, data, horario_inicio, horario_fim, observacoes, nome_cliente, forma_pagamento } = req.body;
    await db.execute(
      `INSERT INTO reservas (estacao_id, entrada_data, entrada_hora, saida_data, saida_hora, status, observacoes, nome_cliente, forma_pagamento)
       VALUES (?, ?, ?, ?, ?, 'CONFIRMADA', ?, ?, ?)`,
      [estacao_id, data, horario_inicio, data, horario_fim, observacoes || '', nome_cliente || '', forma_pagamento || 'PIX']
    );
    return resposta(res, 201, 'Reserva criada');
  } catch (error) {
    console.error(error);
    return resposta(res, 500, 'Erro ao criar reserva');
  }
});

api.get('/reservas', async (req, res) => {
  try {
    const rows = await db.execute(
      `SELECT
         r.id,
         r.usuario_id,
         r.nome_cliente,
         r.estacao_id,
         r.entrada_data   AS data,
         r.entrada_hora   AS horario_inicio,
         r.saida_hora     AS horario_fim,
         r.status,
         r.observacoes,
         r.forma_pagamento,
         e.nome           AS estacao_nome,
         e.preco          AS estacao_preco,
         ROUND(
           EXTRACT(EPOCH FROM (r.saida_hora::time - r.entrada_hora::time)) / 3600.0
           * e.preco, 2
         )                AS valor_total
       FROM reservas r
       LEFT JOIN estacoes e ON r.estacao_id = e.id
       ORDER BY r.entrada_data DESC, r.entrada_hora DESC`
    );

    const formatarData = (d) => {
      if (!d) return null;
      if (d instanceof Date) {
        const ano = d.getUTCFullYear();
        const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dia = String(d.getUTCDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
      }
      return String(d).slice(0, 10);
    };

    const formatarHora = (h) => {
      if (!h) return null;
      return String(h).slice(0, 5);
    };

    const reservasFormatadas = rows.map((row) => ({
      ...row,
      data: formatarData(row.data),
      horario_inicio: formatarHora(row.horario_inicio),
      horario_fim: formatarHora(row.horario_fim),
      nome_cliente: row.nome_cliente ?? null,
      forma_pagamento: row.forma_pagamento ?? 'PIX',
      status: (row.status || 'CONFIRMADA').toUpperCase(),
      valor_total: row.valor_total != null ? Number(row.valor_total) : null,
    }));

    return resposta(res, 200, 'Reservas carregadas', reservasFormatadas);
  } catch (error) {
    console.error('Erro ao listar reservas:', error);
    return resposta(res, 500, 'Erro interno ao listar reservas');
  }
});

api.patch('/reservas/:id/cancelar', async (req, res) => {
  try {
    await db.execute(`UPDATE reservas SET status = 'CANCELADA' WHERE id = ?`, [req.params.id]);
    return resposta(res, 200, 'Reserva cancelada');
  } catch (error) {
    console.error(error);
    return resposta(res, 500, 'Erro ao cancelar reserva');
  }
});

api.patch('/reservas/:id/pagar', async (req, res) => {
  try {
    await db.execute(`UPDATE reservas SET status = 'CONCLUIDA' WHERE id = ?`, [req.params.id]);
    return resposta(res, 200, 'Pagamento confirmado');
  } catch (error) {
    console.error(error);
    return resposta(res, 500, 'Erro ao confirmar pagamento');
  }
});

api.delete('/reservas/:id', async (req, res) => {
  try {
    await db.execute(`DELETE FROM reservas WHERE id = ?`, [req.params.id]);
    return resposta(res, 200, 'Reserva apagada');
  } catch (error) {
    console.error(error);
    return resposta(res, 500, 'Erro ao apagar reserva');
  }
});

app.use(['/api', '/inkstation-api/api'], api);
app.listen(PORT, HOST, () => console.log(`Servidor rodando em http://${HOST}:${PORT}/api`));
