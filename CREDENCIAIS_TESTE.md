# 🎨 Credenciais de Teste - InkStation

## Login - Usuários pré-cadastrados

Use qualquer uma das contas abaixo para fazer login:

### 1. **Artista Silva**
- **Email**: `artista@example.com`
- **Senha**: `senha123456`

### 2. **João Tattoo**
- **Email**: `joao@example.com`
- **Senha**: `Senha123!`

---

## Criar nova conta (Cadastro)

1. Clique em **"Criar cadastro"**
2. Preencha:
   - **Nome artístico**: (seu nome de artista)
   - **E-mail**: (um e-mail válido - pode ser qualquer um, já que é banco em memória)
   - **Senha**: (mínimo 8 caracteres)
   - **Confirmar senha**: (deve ser igual à senha acima)
3. Clique em **"Criar cadastro"**
4. Você será automaticamente logado com a nova conta

---

## 🚀 Como rodar a aplicação

### Terminal 1 - Backend
```bash
cd backend
npm start
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start -- --host 0.0.0.0
```

### Abrir no navegador
```
http://localhost:4200
```

---

## ⚠️ Notas Importantes

- O banco de dados é em **memória**, então todos os dados serão perdidos quando o servidor for reiniciado
- Cada vez que inicia o backend, os usuários pré-cadastrados são restaurados
- Se errar a senha no login, clique em **"Criar nova conta com outra senha"** para registrar um novo usuário
- O proxy do frontend está configurado para chamar o backend local em `http://localhost:3000`

---

## 📱 Fluxo completo de teste

1. ✅ **Login**: Use as credenciais acima ou crie uma nova conta
2. ✅ **Ver estações**: Após login, visualize as estações disponíveis
3. ✅ **Fazer reserva**: Escolha uma estação e reserve um horário
4. ✅ **Ver reservas**: Veja suas reservas na seção "Minhas Reservas"
5. ✅ **Cancelar reserva**: Cancele se necessário
6. ✅ **Chatbot**: Converse com o assistente da IA sobre as estações

---

## 🔧 Troubleshooting

### "E-mail ou senha inválidos"
- Certifique-se que está usando uma das credenciais acima ou crie uma nova conta
- Verifique se o backend está rodando em `http://localhost:3000`

### Frontend não conecta ao backend
- Verifique que o backend está rodando: `npm start` em `/backend`
- Verifique a porta: deve ser `3000`
- Limpe o cache do navegador (Ctrl+Shift+Delete)

### Erro de CORS
- O proxy está configurado automaticamente em `proxy.conf.json`
- Se ainda houver erro, o backend está bloqueando a origem

---

Created: 2026-08-30
