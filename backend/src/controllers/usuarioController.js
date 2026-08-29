const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function cadastrarUsuario(req, res){
    try{
        const { nome, email, senha, telefone } = req.body;
        if (!nome || !email || !senha){
            return res.status(400).json({
                mensagem: 'Nome, e-mail e senha são obrigatorios.'
            });
        }
        const [usuarios] = await db.execute(
            'SELECT id FROM usuario WHERE email = ?',
            [email]
        );
        if (usuarios.length > 0) {
            return res.status(409).json({
                mensagem: 'este e-mail ja está cadastrado.'
            });
        }
        const senhaHash = await bcrypt.hash(senha, 10);
        const [resultado] = await db.execute(
            `INSERT INTO usuario
            (nome, email, senha_hash, telefone)
            VALUES (?, ?, ?, ?)`,
            [nome, email, senhaHash, telefone || null]
        );
        return res.status(201).json({
            mensagem: 'Usuario cadastrado com sucesso.',
            usuario: {
                id: resultado.insertId,
                nome,
                email,
                telefone: telefone || null
            }
        });
    } catch (erro) {
        console.error('Erro ao cadastrar usuario:', erro);
        return res.status(500).json({
            mensagem: 'Erro interno do servidor.'
        });
    }
}
module.exports = {
    cadastrarUsuario
};