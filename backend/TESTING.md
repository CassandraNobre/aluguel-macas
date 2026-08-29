# InkStation API - Guia de Testes dos Endpoints

Guia completo para testar todos os endpoints da API InkStation.

## 🧪 Executar Testes com Postman

### Passo 1: Importar Coleção

1. Abra Postman
2. Clique em "Import"
3. Cole o JSON de coleção abaixo OU use o arquivo `inkstation.postman_collection.json`

### Passo 2: Configurar Ambiente

Crie um novo ambiente com as seguintes variáveis:

```
base_url: http://localhost/inkstation/public/api
token: (será preenchido automaticamente após login)
usuario_id: (será preenchido automaticamente após criar usuário)
estacao_id: 1
reserva_id: (será preenchido automaticamente após criar reserva)
data_teste: 2026-08-25
```

---

## 📋 Testes por Ordem

### 1️⃣ AUTENTICAÇÃO

#### 1.1 - Registrar Novo Usuário

```http
POST {{base_url}}/auth/register
Content-Type: application/json

{
  "nome_artistico": "Teste Artist {{$timestamp}}",
  "email": "teste{{$timestamp}}@example.com",
  "senha": "senha123456",
  "confirmar_senha": "senha123456"
}
```

**Teste**: Registre 3 usuários diferentes
**Validações**:
- Status: 201
- `success` = true
- `data.id` preenchido
- `data.email` = email enviado

**Casos de Erro**:
```json
// Email já existe
{
  "nome_artistico": "User",
  "email": "duplicado@example.com",
  "senha": "senha123456",
  "confirmar_senha": "senha123456"
}

// Senhas não conferem
{
  "nome_artistico": "User",
  "email": "novo@example.com",
  "senha": "senha123456",
  "confirmar_senha": "senha654321"
}

// Senha muito curta
{
  "nome_artistico": "User",
  "email": "novo@example.com",
  "senha": "123",
  "confirmar_senha": "123"
}

// Email inválido
{
  "nome_artistico": "User",
  "email": "email-invalido",
  "senha": "senha123456",
  "confirmar_senha": "senha123456"
}
```

#### 1.2 - Login

```http
POST {{base_url}}/auth/login
Content-Type: application/json

{
  "email": "artista@example.com",
  "senha": "senha123456"
}
```

**Teste**: Faça login com o usuário criado
**Validações**:
- Status: 200
- `success` = true
- `data.token` preenchido (salve esta variável)
- `data.user.id` = ID do usuário

**Teste**: Salve o token automaticamente com este script pré-requisito:
```javascript
if (pm.response.code === 200) {
  const data = pm.response.json();
  if (data.data && data.data.token) {
    pm.environment.set("token", data.data.token);
    pm.environment.set("usuario_id", data.data.user.id);
  }
}
```

**Casos de Erro**:
```json
// Email não existe
{
  "email": "naoexiste@example.com",
  "senha": "senha123456"
}

// Senha incorreta
{
  "email": "artista@example.com",
  "senha": "senhaerrada"
}

// Dados vazios
{
  "email": "",
  "senha": ""
}
```

#### 1.3 - Obter Usuário Atual

```http
GET {{base_url}}/auth/me
Authorization: Bearer {{token}}
```

**Teste**: Verifique se retorna dados do usuário logado
**Validações**:
- Status: 200
- `data.id` = ID logado
- `data.nome_artistico` preenchido
- `data.email` preenchido

**Teste sem autenticação**:
```http
GET {{base_url}}/auth/me
```
**Esperado**: Status 401, mensagem "Usuário não autenticado"

#### 1.4 - Logout

```http
POST {{base_url}}/auth/logout
Authorization: Bearer {{token}}
```

**Teste**: Faça logout
**Validações**:
- Status: 200
- `message` = "Logout realizado com sucesso"

**Teste**: Tente fazer requisição autenticada após logout
```http
GET {{base_url}}/auth/me
Authorization: Bearer {{token}}
```
**Esperado**: Status 401 (token inválido)

---

### 2️⃣ ESTAÇÕES

#### 2.1 - Listar Todas as Estações

```http
GET {{base_url}}/estacoes
```

**Teste**: Sem autenticação, deve funcionar
**Validações**:
- Status: 200
- `data` = array com estações
- Cada estação tem: id, nome, categoria, preco_por_hora, recursos
- `recursos` é um array JSON

**Teste com Filtros**:
```http
GET {{base_url}}/estacoes?categoria=Premium
```
(Nota: Filtro pode ser implementado futuramente)

#### 2.2 - Obter Detalhes da Estação

```http
GET {{base_url}}/estacoes/1
```

**Teste**: Com estação existente
**Validações**:
- Status: 200
- `data.id` = 1
- Todos os campos preenchidos

**Teste**: Com estação inexistente
```http
GET {{base_url}}/estacoes/9999
```
**Esperado**: Status 404, "Registro não encontrado"

#### 2.3 - Verificar Disponibilidade

```http
GET {{base_url}}/estacoes/1/disponibilidade?data=2026-08-25
```

**Teste**: Com data válida
**Validações**:
- Status: 200
- `data.data` = data enviada
- `data.estacao_id` = 1
- `data.horarios_ocupados` = array
- `data.horarios_disponiveis` = array com slots livres

**Teste**: Com data inválida
```http
GET {{base_url}}/estacoes/1/disponibilidade?data=2026-01-01
```
**Esperado**: Status 400, erro de validação

**Teste**: Com data anterior a hoje
```http
GET {{base_url}}/estacoes/1/disponibilidade?data=2020-01-01
```
**Esperado**: Status 400, "Data não pode ser anterior a hoje"

---

### 3️⃣ RESERVAS

#### 3.1 - Criar Reserva

```http
POST {{base_url}}/reservas
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "estacao_id": 1,
  "data": "2026-08-25",
  "horario_inicio": "09:00",
  "horario_fim": "13:00",
  "observacoes": "Sessão de realismo"
}
```

**Teste**: Criar reserva com dados válidos
**Validações**:
- Status: 201
- `data.id` preenchido (salve como {{reserva_id}})
- `data.status` = "confirmada"
- `data.valor_total` = 4 (horas) × 35 (preço) = 140

**Teste Script pré-requisito**:
```javascript
if (pm.response.code === 201) {
  const data = pm.response.json();
  pm.environment.set("reserva_id", data.data.id);
}
```

**Casos de Erro**:

```json
// Sem autenticação
// Status: 401
```

```json
// Horário final antes do inicial
{
  "estacao_id": 1,
  "data": "2026-08-25",
  "horario_inicio": "13:00",
  "horario_fim": "09:00",
  "observacoes": ""
}
// Esperado: 400 - "Horário final deve ser maior que o horário inicial"
```

```json
// Data anterior a hoje
{
  "estacao_id": 1,
  "data": "2020-01-01",
  "horario_inicio": "09:00",
  "horario_fim": "13:00",
  "observacoes": ""
}
// Esperado: 400 - "Data não pode ser anterior a hoje"
```

```json
// Formato de data inválido
{
  "estacao_id": 1,
  "data": "25-08-2026",
  "horario_inicio": "09:00",
  "horario_fim": "13:00",
  "observacoes": ""
}
// Esperado: 400 - Erro de validação
```

```json
// Estação inexistente
{
  "estacao_id": 9999,
  "data": "2026-08-25",
  "horario_inicio": "09:00",
  "horario_fim": "13:00",
  "observacoes": ""
}
// Esperado: 400 - "Estação não está ativa"
```

#### 3.2 - Conflito de Horário

Crie duas reservas que se conflitem:

**Primeiro, crie uma reserva**:
```json
{
  "estacao_id": 1,
  "data": "2026-08-26",
  "horario_inicio": "10:00",
  "horario_fim": "14:00",
  "observacoes": "Primeira reserva"
}
```

**Depois, tente criar conflitante**:
```json
{
  "estacao_id": 1,
  "data": "2026-08-26",
  "horario_inicio": "12:00",
  "horario_fim": "15:00",
  "observacoes": "Conflita com primeira"
}
```

**Esperado**: Status 409, "Conflito de horário nesta data"

#### 3.3 - Listar Reservas do Usuário

```http
GET {{base_url}}/reservas
Authorization: Bearer {{token}}
```

**Teste**: Liste reservas do usuário autenticado
**Validações**:
- Status: 200
- `data` = array com reservas do usuário
- Cada reserva tem: id, usuario_id, estacao_id, data, etc

**Teste**: Tente sem token
**Esperado**: Status 401

#### 3.4 - Obter Detalhes da Reserva

```http
GET {{base_url}}/reservas/{{reserva_id}}
Authorization: Bearer {{token}}
```

**Teste**: Com reserva do próprio usuário
**Validações**:
- Status: 200
- `data.id` = {{reserva_id}}

**Teste**: Tente acessar reserva de outro usuário
1. Crie um segundo usuário
2. Faça login com primeiro usuário e anote uma reserva
3. Faça login com segundo usuário
4. Tente acessar reserva do primeiro usuário

```http
GET {{base_url}}/reservas/{id_do_outro_usuario}
Authorization: Bearer {{token_usuario2}}
```

**Esperado**: Status 404 (não deve ver reservas de outro usuário)

#### 3.5 - Cancelar Reserva

```http
PATCH {{base_url}}/reservas/{{reserva_id}}/cancelar
Authorization: Bearer {{token}}
```

**Teste**: Cancele uma reserva confirmada
**Validações**:
- Status: 200
- `data.status` = "cancelada"
- `message` = "Reserva cancelada com sucesso"

**Teste**: Tente cancelar mesma reserva novamente
**Esperado**: Status 400, "Esta reserva não pode ser cancelada"

**Teste**: Tente cancelar reserva de outro usuário
**Esperado**: Status 403, "Sem permissão"

---

## 🔄 Cenários de Teste Integrados

### Cenário 1: Fluxo Completo de Reserva

```
1. Registrar → 2. Login → 3. Listar Estações → 
4. Verificar Disponibilidade → 5. Criar Reserva → 
6. Listar Minhas Reservas → 7. Cancelar Reserva → 8. Logout
```

### Cenário 2: Teste de Segurança

```
1. Tentar acessar endpoint protegido sem token
   → GET /api/reservas (sem Authorization)
   → Esperado: 401

2. Tentar usar token inválido
   → GET /api/reservas (com token errado)
   → Esperado: 401

3. Tentar acessar recurso de outro usuário
   → GET /api/reservas/{id_outro_usuario}
   → Esperado: 404 ou 403

4. Tente SQL Injection
   → POST /api/auth/login com email: "' OR '1'='1"
   → Esperado: Tratado como string literal (seguro)
```

### Cenário 3: Teste de Validação

```
1. Campos vazios
2. Dados com tipos errados (string em vez de número)
3. Datas inválidas (formatos errados, datas passadas)
4. Horários inválidos (24:00, 25:00)
5. Valores negativos
6. Strings muito longas
```

---

## 💻 Executar Testes via CLI (cURL)

### Script bash para teste completo

```bash
#!/bin/bash

# Configuração
API_URL="http://localhost/inkstation/public/api"
EMAIL="teste$(date +%s)@example.com"
NOME="Artista Test"
SENHA="senha123456"

echo "=== 1. REGISTRAR USUÁRIO ==="
REGISTRO=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"nome_artistico\": \"$NOME\",
    \"email\": \"$EMAIL\",
    \"senha\": \"$SENHA\",
    \"confirmar_senha\": \"$SENHA\"
  }")

echo $REGISTRO | jq .

echo -e "\n=== 2. LOGIN ==="
LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"senha\": \"$SENHA\"
  }")

echo $LOGIN | jq .

TOKEN=$(echo $LOGIN | jq -r '.data.token')
echo "Token: $TOKEN"

echo -e "\n=== 3. LISTAR ESTAÇÕES ==="
curl -s -X GET "$API_URL/estacoes" | jq '.data | length'

echo -e "\n=== 4. CRIAR RESERVA ==="
RESERVA=$(curl -s -X POST "$API_URL/reservas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "estacao_id": 1,
    "data": "2026-08-25",
    "horario_inicio": "09:00",
    "horario_fim": "13:00",
    "observacoes": "Teste"
  }')

echo $RESERVA | jq .

RESERVA_ID=$(echo $RESERVA | jq -r '.data.id')
echo "Reserva ID: $RESERVA_ID"

echo -e "\n=== 5. LISTAR MINHAS RESERVAS ==="
curl -s -X GET "$API_URL/reservas" \
  -H "Authorization: Bearer $TOKEN" | jq '.data | length'

echo -e "\n✅ Teste concluído com sucesso!"
```

Salve como `test-api.sh` e execute:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 📊 Matriz de Testes

| Endpoint | Método | Autenticado | Esperado | Status |
|----------|--------|-------------|----------|--------|
| /auth/register | POST | Não | 201 | ✅ |
| /auth/login | POST | Não | 200 | ✅ |
| /auth/me | GET | Sim | 200 | ✅ |
| /auth/logout | POST | Sim | 200 | ✅ |
| /estacoes | GET | Não | 200 | ✅ |
| /estacoes/{id} | GET | Não | 200 | ✅ |
| /estacoes/{id}/disponibilidade | GET | Não | 200 | ✅ |
| /reservas | GET | Sim | 200 | ✅ |
| /reservas | POST | Sim | 201 | ✅ |
| /reservas/{id} | GET | Sim | 200 | ✅ |
| /reservas/{id}/cancelar | PATCH | Sim | 200 | ✅ |

---

## ⚠️ Testes de Erro

| Cenário | Status Esperado |
|---------|-----------------|
| Endpoint não existe | 404 |
| Sem autenticação em rota protegida | 401 |
| Token expirado | 401 |
| Sem permissão | 403 |
| Conflito de horário | 409 |
| Dados inválidos | 400 |
| Email duplicado | 409 |
| Banco de dados fora | 500 |

---

## 📈 Performance

Teste tempos de resposta:

```bash
# Time a requisição
time curl -s "$API_URL/estacoes" > /dev/null
```

Esperado: < 100ms para requisições simples

---

## 🎯 Conclusão

Após completar todos estes testes, você terá validado:
✅ Autenticação e autorização
✅ Validação de dados
✅ Proteção contra SQL Injection
✅ Tratamento de erros
✅ Conflito de horários
✅ Cálculo de valores
✅ Integração com banco de dados
