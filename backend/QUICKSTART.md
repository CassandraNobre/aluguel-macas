# InkStation - Guia Rápido de Início

## 🚀 Começar em 5 Minutos

### 1. Verificar Estrutura
O projeto está em: `C:\xampp\htdocs\inkstation\`

Deve conter:
- ✅ `public/index.php` (ponto de entrada)
- ✅ `config/` (banco de dados)
- ✅ `controllers/` (endpoints)
- ✅ `database/schema.sql` (tabelas)
- ✅ `.env.example` (configuração)

### 2. Iniciar XAMPP
```
C:\xampp\xampp-control.exe
→ Clique [Start] Apache
→ Clique [Start] MySQL
```

### 3. Criar Banco de Dados
1. Abra http://localhost/phpmyadmin
2. Clique "Novo" → Digite `inkstation` → Criar
3. Clique aba "SQL"
4. Cole conteúdo de `database/schema.sql`
5. Clique "Executar" ✅

### 4. Testar
Abra navegador:
```
http://localhost/inkstation/public/api/estacoes
```

Deve retornar JSON com estações

### 5. Usar API
**Com curl:**
```bash
curl http://localhost/inkstation/public/api/estacoes
```

**Com Postman:**
1. Importe `inkstation.postman_collection.json`
2. Configure base_url
3. Execute

**Com JavaScript:**
```javascript
fetch('http://localhost/inkstation/public/api/estacoes')
  .then(r => r.json())
  .then(d => console.log(d))
```

---

## 📋 Endpoints Principais

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| POST | `/auth/register` | Não | Registrar usuário |
| POST | `/auth/login` | Não | Login e obter token |
| GET | `/auth/me` | Sim | Dados do usuário |
| GET | `/estacoes` | Não | Listar estações |
| GET | `/estacoes/{id}` | Não | Detalhes estação |
| GET | `/estacoes/{id}/disponibilidade?data=YYYY-MM-DD` | Não | Horários livres |
| POST | `/reservas` | Sim | Criar reserva |
| GET | `/reservas` | Sim | Minhas reservas |
| GET | `/reservas/{id}` | Sim | Detalhes reserva |
| PATCH | `/reservas/{id}/cancelar` | Sim | Cancelar reserva |

---

## 🔑 Usuários de Teste Inclusos

```
Email: artista@example.com
Senha: senha123456
```

Mais 2 usuários pré-carregados para testes.

---

## 🧪 Teste Rápido com cURL

### Registrar
```bash
curl -X POST http://localhost/inkstation/public/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"nome_artistico\":\"Test\",\"email\":\"test@test.com\",\"senha\":\"senha123456\",\"confirmar_senha\":\"senha123456\"}"
```

### Login
```bash
curl -X POST http://localhost/inkstation/public/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"artista@example.com\",\"senha\":\"senha123456\"}"
```

Salve o `token` da resposta.

### Criar Reserva
```bash
curl -X POST http://localhost/inkstation/public/api/reservas ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_AQUI" ^
  -d "{\"estacao_id\":1,\"data\":\"2026-08-25\",\"horario_inicio\":\"09:00\",\"horario_fim\":\"13:00\",\"observacoes\":\"Teste\"}"
```

---

## 📁 Arquivos Importantes

| Arquivo | Função |
|---------|--------|
| `README.md` | Documentação completa |
| `INSTALACAO_XAMPP.md` | Passo a passo instalação |
| `TESTING.md` | Guia de testes |
| `database/schema.sql` | Criação do banco |
| `examples/api-examples.js` | Exemplos JavaScript |
| `inkstation.postman_collection.json` | Testes Postman |

---

## ⚙️ Configuração (.env)

Arquivo `.env` na raiz do projeto:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=inkstation
DB_PORT=3306
SESSION_TIMEOUT=3600
TOKEN_EXPIRY=604800
API_URL=http://localhost/api
FRONTEND_URL=http://localhost:4200
```

### Acesso por outro computador da rede

No computador onde o Node está rodando, descubra o IPv4 com `ipconfig`. Neste ambiente, o endereço é `192.168.1.165`.

No Angular do outro computador, use:

```
http://192.168.1.165:3000/api
```

Não use `localhost:3000` no computador remoto: `localhost` sempre aponta para a própria máquina que executa o navegador. O backend precisa estar iniciado com `npm start`, a porta TCP 3000 deve estar liberada no Firewall do Windows e os dois computadores devem estar na mesma rede.

O CORS aceita `http://localhost:4200` por padrão. Se o frontend for aberto por outro origin, adicione-o à variável `FRONTEND_URL`, separando múltiplos origins por vírgula, por exemplo:

```
FRONTEND_URL=http://localhost:4200,http://192.168.1.165:4200
```

---

## 🔒 Segurança - O Que Está Protegido

✅ Senhas com bcrypt
✅ SQL Injection (prepared statements)
✅ CORS configurado
✅ Tokens com expiração
✅ Validação de entrada
✅ Autorização por usuário
✅ Transações de banco

---

## 🛠️ Troubleshooting Rápido

### API retorna 404
- [ ] `.htaccess` existe em `public/`?
- [ ] Apache mod_rewrite habilitado?
- [ ] Reiniciou Apache?

### Conexão ao banco falha
- [ ] MySQL está rodando?
- [ ] Banco `inkstation` criado?
- [ ] `.env` configurado?

### Token inválido
- [ ] Tabela `auth_tokens` existe?
- [ ] Fez login recentemente?
- [ ] Token não expirou?

---

## 🚀 Próximos Passos

1. **Testar endpoints** → Usar TESTING.md
2. **Integrar frontend** → Ver exemplos em api-examples.js
3. **Ir para produção** → Configurar SSL/HTTPS
4. **Adicionar features** → Expandir controllers

---

## 📞 Documentação Completa

- **README.md** - Setup, endpoints, integração
- **INSTALACAO_XAMPP.md** - Instalação detalhada
- **TESTING.md** - Testes completos
- **DELIVERABLES.md** - Resumo técnico

---

**Tudo está pronto para usar! 🎉**

Dúvidas? Consulte os arquivos MD acima.
