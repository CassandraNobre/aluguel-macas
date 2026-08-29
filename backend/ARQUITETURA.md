# InkStation - Arquitetura do Sistema

## 📐 Diagrama de Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTE (Frontend)                      │
│                  Angular / React / JavaScript                │
│                  (Fetch API / HTTP Client)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP Request
                  (JSON + Bearer Token)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE ROTEAMENTO                      │
│                 public/index.php + .htaccess                 │
│          Apache mod_rewrite → Decodifica URL/Método          │
└────────────────┬──────────────────────────────────┬──────────┘
                 │                                  │
                 ▼                                  ▼
         ┌──────────────────┐           ┌──────────────────┐
         │  AuthController  │           │  ReservaController
         │  EstacaoController           │ (Lógica Negócio)
         │  (Endpoints)     │           │                  │
         └────────┬─────────┘           └────────┬─────────┘
                  │                              │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
        ┌──────────────────────────────────────┐
        │   CAMADA DE VALIDAÇÃO & UTILITÁRIOS  │
        ├──────────────────────────────────────┤
        │ • ResponseHandler.php (Respostas)   │
        │ • Validator.php (Entrada)            │
        │ • Auth.php (Token/Session)           │
        │ • Constants.php (Config)             │
        └────────────┬─────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────┐
        │      CAMADA DE PERSISTÊNCIA          │
        ├──────────────────────────────────────┤
        │      Database.php (PDO Singleton)    │
        │                                      │
        │  Prepared Statements                 │
        │  Transações                          │
        │  Conexão Pool                        │
        └────────────┬─────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────┐
        │        BANCO DE DADOS MySQL          │
        ├──────────────────────────────────────┤
        │ ├─ usuarios                          │
        │ ├─ estacoes                          │
        │ ├─ reservas (Lógica Principal)       │
        │ ├─ auth_tokens                       │
        │ └─ audit_logs                        │
        └──────────────────────────────────────┘
```

---

## 🔄 Fluxo de Requisição

```
1. CLIENT REQUEST
   ↓
   POST /api/auth/login
   Content-Type: application/json
   { "email": "...", "senha": "..." }

2. APACHE
   ↓
   mod_rewrite → public/index.php
   Decodifica URL: /api/auth/login
   Método: POST

3. ROUTING (index.php)
   ↓
   Route::match("auth", "login") → AuthController::login()

4. AUTHENTICATION CHECK (Optional)
   ↓
   Auth::isAuthenticated()
   (Verifica Session ou Token)

5. CONTROLLER LOGIC
   ↓
   AuthController::login()
   ├─ Valida input (Validator::validateLogin)
   ├─ Busca usuário (Database::fetch)
   ├─ Verifica senha (Auth::verifyPassword)
   ├─ Cria token (Auth::generateToken)
   └─ Retorna resposta

6. DATABASE QUERY
   ↓
   SELECT * FROM usuarios WHERE email = ?
   (PDO Prepared Statement - SEGURO)

7. RESPONSE
   ↓
   ResponseHandler::success({
     "user": { ... },
     "token": "abc123..."
   })

8. BROWSER
   ↓
   200 OK
   Content-Type: application/json
   { "success": true, "data": { ... } }

9. FRONTEND
   ↓
   localStorage.setItem('authToken', token)
   Redireciona para Dashboard
```

---

## 🔐 Fluxo de Segurança

```
REQUEST COM TOKEN
  │
  ▼
┌─────────────────────────────┐
│ Extrai Authorization Header │
│ Format: "Bearer TOKEN_XYZ"   │
└────────────┬────────────────┘
             │
             ▼
    ┌─────────────────────┐
    │ Valida Token Formato │
    │ (regex Bearer)       │
    └────────────┬────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │ Hash Token (sha256)          │
    │ BuscaDB:                     │
    │ SELECT FROM auth_tokens      │
    │ WHERE token_hash = ?         │
    │ AND expires_at > NOW()       │
    └────────────┬────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
   SIM                        NÃO
    │                         │
    ▼                         ▼
AUTORIZA          ┌──────────────────┐
REQUEST           │ Retorna 401      │
    │             │ Unauthorized     │
    │             └──────────────────┘
    │
    ▼
VERIFICA AUTORIZAÇÃO
├─ Usuário pode ver recurso?
├─ Recurso pertence ao usuário?
└─ Permissões corretas?

SIM → Processa
NÃO → Retorna 403 Forbidden
```

---

## 💾 Estrutura do Banco de Dados

```
┌─────────────────────┐
│    USUARIOS         │
├─────────────────────┤
│ PK: id              │
│    nome_artistico   │
│    email (UNIQUE)   │
│    senha_hash       │
│    google_id        │
│    timestamps       │
└──────────┬──────────┘
           │ (1:N)
           │
    ┌──────┴───────┐
    │              │
    ▼              ▼
┌──────────┐   ┌──────────────┐
│RESERVAS  │   │AUTH_TOKENS   │
├──────────┤   ├──────────────┤
│ PK: id   │   │ PK: id       │
│ FK: user │   │ FK: user     │
│ FK: esta │   │    token_hash│
│ data     │   │    expires_at│
│ hora_ini │   └──────────────┘
│ hora_fim │
│ duracao  │
│ valor    │
│ status   │
└────┬─────┘
     │ (N:1)
     │
     ▼
┌──────────────────┐
│    ESTACOES      │
├──────────────────┤
│ PK: id           │
│    nome          │
│    categoria     │
│    preco_hora    │
│    recursos(JSON)│
│    ativa         │
│    timestamps    │
└──────────────────┘

┌──────────────────┐
│  AUDIT_LOGS      │
├──────────────────┤
│ PK: id           │
│ FK: usuario      │
│    acao          │
│    tabela        │
│    dados_ant     │
│    dados_novos   │
│    ip_address    │
│    timestamps    │
└──────────────────┘
```

---

## 📊 Fluxo de Criação de Reserva (Caso Complexo)

```
POST /api/reservas
Authorization: Bearer TOKEN
{
  "estacao_id": 1,
  "data": "2026-08-25",
  "horario_inicio": "09:00",
  "horario_fim": "13:00",
  "observacoes": "..."
}

1. AUTHENTICATE
   └─ Verifica token → OK

2. VALIDATE INPUT
   ├─ estacao_id: válido?
   ├─ data: formato correto?
   ├─ data: não está no passado?
   ├─ horario_inicio: formato correto?
   ├─ horario_fim: formato correto?
   └─ horario_fim > horario_inicio?

3. VERIFY BUSINESS RULES
   ├─ Estação existe?
   ├─ Estação está ativa?
   └─ Duração > 0?

4. BEGIN TRANSACTION
   └─ START TRANSACTION

5. CHECK CONFLICTS
   └─ SELECT FROM reservas WHERE
      estacao_id = 1 AND
      data = "2026-08-25" AND
      status IN ('confirmada', 'pendente') AND
      horario_inicio < "13:00" AND
      horario_fim > "09:00"
      
      ┌─────────────┐
      │ Achou linha?│
      └──────┬──────┘
            SIM → ROLLBACK + 409 CONFLICT
             │
             NÃO
             │
             ▼

6. CALCULATE VALUES
   ├─ duracao = (13:00 - 09:00) = 4 horas
   └─ valor_total = 4 * preco_por_hora = 140

7. INSERT RESERVATION
   └─ INSERT INTO reservas
      (usuario_id, estacao_id, data,
       horario_inicio, horario_fim,
       duracao, valor_total, status, ...)
      VALUES (...)

8. COMMIT TRANSACTION
   └─ COMMIT

9. FETCH CREATED RECORD
   └─ SELECT * FROM reservas WHERE id = ?

10. RETURN RESPONSE
    └─ 201 Created
       {
         "id": 1,
         "data": "2026-08-25",
         "horario_inicio": "09:00",
         "horario_fim": "13:00",
         "duracao": 4,
         "valor_total": 140,
         "status": "confirmada",
         ...
       }
```

---

## 🛡️ Camadas de Segurança

```
ENTRADA
  │
  ▼
┌────────────────────────────────┐
│ 1. VALIDAÇÃO DE FORMATO        │
│    • Email regex               │
│    • Data/Hora regex           │
│    • JSON válido               │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 2. SANITIZAÇÃO                 │
│    • Trim whitespace           │
│    • Escape HTML               │
│    • Tipo cast                 │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 3. AUTENTICAÇÃO                │
│    • Token válido?             │
│    • Não expirou?              │
│    • Session válida?           │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 4. AUTORIZAÇÃO                 │
│    • Usuário tem permissão?    │
│    • Recurso pertence ao user? │
│    • Role correto?             │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 5. PREPARED STATEMENTS         │
│    • Parâmetros ligados        │
│    • Sem concatenação          │
│    • SQL Injection BLOQUEADO   │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 6. TRANSAÇÕES (ACID)           │
│    • Atomicidade               │
│    • Consistência              │
│    • Isolamento                │
│    • Durabilidade              │
└────────────┬───────────────────┘
             │
             ▼
        BANCO DE DADOS
```

---

## 📈 Performance e Índices

```
ÍNDICES CRIADOS:

usuarios
├─ PRIMARY: id
├─ UNIQUE: email
└─ INDEX: google_id, created_at

estacoes
├─ PRIMARY: id
├─ INDEX: nome, ativa, created_at

reservas
├─ PRIMARY: id
├─ FOREIGN: usuario_id
├─ FOREIGN: estacao_id
├─ INDEX: data, status
├─ COMPOSITE: usuario_id + data
├─ COMPOSITE: estacao_id + data
└─ UNIQUE: estacao_id+data+hora_ini+hora_fim+status

auth_tokens
├─ PRIMARY: id
├─ FOREIGN: usuario_id
├─ INDEX: expires_at
└─ UNIQUE: token_hash

RESULTADO:
✅ Queries rápidas em O(1) a O(log n)
✅ Sem full table scans
✅ Conflito detectado em milissegundos
```

---

## 🚀 Fluxo de Deployment

```
DESENVOLVIMENTO (Seu PC)
├─ XAMPP local
├─ Banco MySQL local
├─ Assets .env com credenciais locais
└─ Teste com Postman

      ↓ (Tudo funcionando)

STAGING (Servidor de Teste)
├─ Apache com SSL/TLS
├─ MySQL remoto ou local
├─ .env com credenciais staging
├─ Rate limiting
└─ Testes completos

      ↓ (Aprovado)

PRODUÇÃO (Servidor Web)
├─ Apache com SSL/TLS
├─ MySQL remoto (backup diário)
├─ .env com credenciais seguras
├─ Firewall ativo
├─ Monitoramento logs
├─ Backups automáticos
└─ HTTPS forçado
```

---

## 📊 Resumo de Requisições/Respostas

```
REQUEST
├─ Method (GET, POST, PATCH, DELETE)
├─ URL (/api/endpoint)
├─ Headers (Authorization, Content-Type)
└─ Body (JSON)

PROCESSING
├─ Parse Request
├─ Validate & Sanitize
├─ Authenticate & Authorize
├─ Business Logic
├─ Database Operations
└─ Error Handling

RESPONSE
├─ Status Code (200, 201, 400, 401, 403, 404, 409, 500)
├─ Headers (Content-Type: application/json)
└─ Body (JSON)
   {
     "success": boolean,
     "status": number,
     "message": string,
     "data": object | array | null,
     "errors": object | null
   }
```

---

**Arquitetura simples, segura e escalável! 🏗️**
