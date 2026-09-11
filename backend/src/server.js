const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const db = require('./config/database');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const api = express.Router();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

function resposta(res, status, message, data = {}, errors = {}) {
  return res.status(status).json({ success: status < 400, status, message, data, errors });
}

// REGISTRO DE USUÁRIO
api.post('/auth/register', async (req, res) => {
  try {
    const { nome, nome_artistico, email, senha, confirmar_senha, telefone } = req.body;
    const nomeFinal = nome || nome_artistico;

    if (!nomeFinal || !email || !senha) return resposta(res, 400, 'Dados incompletos');
    if (senha !== confirmar_senha) return resposta(res, 400, 'As senhas não conferem');

    const hash = await bcrypt.hash(senha, 12);
    await db.execute(
      'INSERT INTO usuarios (nome, email, senha_hash, telefone) VALUES (?, ?, ?, ?)',
      [nomeFinal, email, hash, telefone || null]
    );
    return resposta(res, 201, 'Usuário cadastrado com sucesso');
  } catch (error) {
    if (error.code === '23505') {
      return resposta(res, 409, 'Este e-mail ou nome já está cadastrado');
    }
    console.error('Erro no registro:', error);
    return resposta(res, 500, 'Erro no registro');
  }
});

// LOGIN (Aceita e-mail ou nome)
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
      user: { id: rows[0].id, nome: rows[0].nome, email: rows[0].email, telefone: rows[0].telefone },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return resposta(res, 500, 'Erro no login');
  }
});

// RECUPERAÇÃO VIA WHATSAPP (Lê identificador, email ou telefone)
api.post('/auth/esqueci-senha', async (req, res) => {
  try {
    const { identificador, email, telefone } = req.body;
    const busca = identificador || email || telefone;

    if (!busca) {
      return resposta(res, 400, 'Informe seu número de WhatsApp');
    }

    const rows = await db.execute(
      'SELECT id, nome, email, telefone FROM usuarios WHERE telefone = ? OR email = ? OR nome = ?',
      [busca, busca, busca]
    );

    if (!rows.length) {
      return resposta(res, 404, 'Número de WhatsApp não encontrado no sistema');
    }

    const usuario = rows[0];
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = new Date(Date.now() + 1800000); // 30 minutos

    await db.execute(
      'UPDATE usuarios SET reset_token = ?, reset_token_expira = ? WHERE id = ?',
      [pin, expira, usuario.id]
    );

    const numTelefone = (usuario.telefone || busca || '').replace(/\D/g, '');
    const mensagem = encodeURIComponent(`Olá ${usuario.nome}! Seu código PIN do InkStation é: ${pin}`);
    const whatsappUrl = numTelefone ? `https://api.whatsapp.com/send?phone=55${numTelefone}&text=${mensagem}` : null;

    return resposta(res, 200, 'Código gerado com sucesso', {
      pin,
      email: usuario.email,
      whatsappUrl,
    });
  } catch (error) {
    console.error('Erro no esqueci-senha:', error);
    return resposta(res, 500, 'Erro ao processar solicitação');
  }
});

// REDEFINIR SENHA COM PIN
api.post('/auth/redefinir-senha', async (req, res) => {
  try {
    const { email, pin, nova_senha, confirmar_senha } = req.body;

    if (!email || !pin || !nova_senha) return resposta(res, 400, 'Dados incompletos');
    if (nova_senha !== confirmar_senha) return resposta(res, 400, 'As senhas não conferem');
    if (nova_senha.length < 8) return resposta(res, 400, 'A senha deve ter no mínimo 8 caracteres');

    const rows = await db.execute(
      'SELECT id FROM usuarios WHERE email = ? AND reset_token = ? AND reset_token_expira > NOW()',
      [email, pin]
    );

    if (!rows.length) {
      return resposta(res, 400, 'Código PIN incorreto ou expirado.');
    }

    const hash = await bcrypt.hash(nova_senha, 12);
    await db.execute(
      'UPDATE usuarios SET senha_hash = ?, reset_token = NULL, reset_token_expira = NULL WHERE id = ?',
      [hash, rows[0].id]
    );

    return resposta(res, 200, 'Senha alterada com sucesso! Faça login com a nova senha.');
  } catch (error) {
    console.error('Erro no redefinir-senha:', error);
    return resposta(res, 500, 'Erro ao redefinir senha');
  }
});

// ESTAÇÕES
api.get('/estacoes', async (req, res) => {
  try {
    const rows = await db.execute(`SELECT id, nome, tipo AS categoria, descricao, preco, imagem AS imagem_url, recursos, ativo AS ativa FROM estacoes WHERE ativo = true ORDER BY nome`);
    return resposta(res, 200, 'Estações carregadas', rows.map((row) => ({ ...row, preco_por_hora: Number(row.preco) })));
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
    return resposta(res, 200, 'Estação carregada', { ...rows[0], preco_por_hora: Number(rows[0].preco) });
  } catch (error) {
    console.error(error);
    return resposta(res, 500, 'Erro interno');
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

// RESERVAS
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