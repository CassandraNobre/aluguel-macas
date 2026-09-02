# 🔧 CONFIGURAR BACKEND NO RENDER

## ✅ Bugs Corrigidos
- ✅ Login agora valida corretamente email e senha (sem erro de null pointer)
- ✅ Cadastro agora valida email e insere dados corretamente
- ✅ Adicionado tratamento de erro para duplicação de email

---

## 📋 PASSOS PARA CONFIGURAR

### 1️⃣ Ir ao Render Dashboard

```
https://dashboard.render.com
```

### 2️⃣ Abra o Serviço `inkstation-backend`

```
Dashboard → My Project → inkstation-backend
```

### 3️⃣ Clique em "Environment" ou "Settings"

Procure pela seção de **Environment Variables**

### 4️⃣ Preencha as Variáveis

Procure por essas variáveis que têm `sync: false` (não sincronizadas):

#### ⚙️ Variável 1: `DB_HOST`
```
Key: DB_HOST
Value: inkstation-mysql-paulohbarros99.a.aivencloud.com
```

#### ⚙️ Variável 2: `DB_USER`
```
Key: DB_USER
Value: [PREENCHER COM SEU USUÁRIO DO AIVEN]
```

Onde encontrar:
- Aiven Console → MySQL Instance → Connections
- Procure por "User" ou "Username"

#### ⚙️ Variável 3: `DB_PASS`
```
Key: DB_PASS
Value: [PREENCHER COM SUA SENHA DO AIVEN]
```

Onde encontrar:
- Aiven Console → MySQL Instance → Connections
- Procure por "Password" ou "Secret"

### 5️⃣ Salvar e Redeploy

1. Clique **"Save"** após preencher cada variável
2. Clique **"Manual Deploy"** no topo da página
3. Aguarde a implantação (2-3 minutos)
4. Verifique o status: deve estar **"Live"** em verde

---

## 🧪 TESTAR APÓS CONFIGURAR

### Teste 1: Health Check
```bash
curl https://inkstation-backend.onrender.com/health
```

Resposta esperada:
```json
{
  "success": true,
  "status": 200,
  "message": "OK",
  "data": { "service": "inkstation-api" }
}
```

### Teste 2: Registrar Novo Usuário
```bash
curl -X POST https://inkstation-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome_artistico": "Teste User",
    "email": "teste@teste.com",
    "senha": "12345678",
    "confirmar_senha": "12345678"
  }'
```

Resposta esperada:
```json
{
  "success": true,
  "status": 201,
  "message": "Usuário cadastrado com sucesso",
  "data": {
    "id": 1,
    "nome_artistico": "Teste User",
    "email": "teste@teste.com"
  }
}
```

### Teste 3: Login
```bash
curl -X POST https://inkstation-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@teste.com",
    "senha": "12345678"
  }'
```

Resposta esperada:
```json
{
  "success": true,
  "status": 200,
  "message": "Login realizado com sucesso",
  "data": {
    "token": "abc123...",
    "user": {
      "id": 1,
      "nome_artistico": "Teste User",
      "email": "teste@teste.com"
    }
  }
}
```

---

## ❌ Se Tiver Erro 500

Significa que o banco não está conectado. Verifique:

1. **Variáveis preenchidas?**
   - Ir em Environment
   - Verificar se DB_USER e DB_PASS têm valores

2. **Valores corretos?**
   - Ir ao Aiven Console
   - Copiar exatamente como está (case-sensitive)
   - Verificar se não tem espaços extras

3. **Banco criado?**
   - Aiven Console → Database
   - Verificar se banco `inkstation` existe
   - Se não, criar via SQL:
     ```sql
     CREATE DATABASE inkstation;
     ```

4. **Tabelas criadas?**
   - Aiven Console → Database → Query Editor
   - Copiar todo o conteúdo de `database/schema.sql`
   - Executar no Query Editor

5. **Ver Logs**
   - Render Dashboard → Logs
   - Procurar por mensagens de erro
   - Compartilhar error mensagem se precisar de ajuda

---

## 📚 Referências

- **Arquivo de configuração**: [.env.render](.env.render)
- **Schema do banco**: [database/schema.sql](database/schema.sql)
- **Código corrigido**: [src/server.js](src/server.js)
- **Configuração de conexão**: [src/config/database.js](src/config/database.js)

---

## ✨ RESUMO

| Item | Status |
|------|--------|
| Código de Login | ✅ Corrigido |
| Código de Cadastro | ✅ Corrigido |
| Variáveis de Ambiente | ⏳ Aguardando preenchimento |
| Tabelas do Banco | ⏳ Verificar se existem |
| Deploy | ⏳ Fazer após configurar |

**Depois que preencher as 3 variáveis no Render e fazer o redeploy, tudo funcionará! 🚀**
