# InkStation - Sistema de Reserva de Estações de Trabalho

## 📋 Descrição

InkStation é um sistema backend (API REST) desenvolvido em PHP para gerenciar reservas de estações de trabalho em um estúdio de tatuagem compartilhado. O sistema permite que usuários tatuadores se registrem, façam login, visualizem estações disponíveis e criem reservas com verificação automática de conflitos de horários.

## 🚀 Características

- **Autenticação Segura**: Senhas protegidas com `password_hash()` e `password_verify()`
- **Autorização**: Sistema de tokens com Bearer Token e sessões PHP
- **Validação de Dados**: Validação rigorosa no backend
- **Prevenção de SQL Injection**: Uso de PDO com prepared statements
- **Proteção de Conflitos**: Transações de banco de dados para evitar reservas simultâneas
- **CORS Configurável**: Suporte para integração com Angular, React e outras SPAs
- **API RESTful**: Endpoints bem definidos seguindo padrões REST
- **Tratamento de Erros**: Respostas JSON padronizadas com códigos HTTP apropriados

## 📊 Stack Tecnológico

- **Linguagem**: PHP 7.4+
- **Banco de Dados**: MySQL 5.7+
- **Servidor Web**: Apache (XAMPP)
- **Padrão de Resposta**: JSON
- **Autenticação**: Sessions + Tokens Bearer
- **Cliente**: JavaScript fetch() / Angular / React

## 📁 Estrutura do Projeto

```
inkstation-backend/
├── public/
│   └── index.php                 # Ponto de entrada da aplicação
├── config/
│   ├── Constants.php             # Constantes de aplicação
│   └── Database.php              # Conexão PDO
├── controllers/
│   ├── AuthController.php        # Endpoints de autenticação
│   ├── EstacaoController.php     # Endpoints de estações
│   └── ReservaController.php     # Endpoints de reservas
├── utils/
│   ├── ResponseHandler.php       # Tratamento de respostas
│   ├── Validator.php             # Validação de dados
│   └── Auth.php                  # Gerenciamento de autenticação
├── database/
│   └── schema.sql                # Script SQL completo
├── examples/
│   └── api-examples.js           # Exemplos de uso com fetch()
├── .env.example                  # Exemplo de arquivo de configuração
├── .htaccess                     # Configuração do Apache
└── README.md                     # Este arquivo
```

## 🔧 Instalação e Configuração

### Pré-requisitos

- XAMPP (Apache + MySQL + PHP 7.4+)
- Navegador moderno
- Cliente HTTP (curl, Postman, ou similar)

### Passo 1: Preparar o Ambiente

1. **Iniciar XAMPP**
   - Abra o XAMPP Control Panel
   - Inicie o Apache
   - Inicie o MySQL

2. **Verificar instalação do PHP**
   ```bash
   php -v
   ```

### Passo 2: Clonar/Criar o Projeto

1. **Copiar arquivos para htdocs**
   ```bash
   # Copie a pasta do projeto para:
   C:\xampp\htdocs\inkstation
   ```

2. **Criar arquivo de configuração**
   ```bash
   # Copie .env.example para .env
   copy .env.example .env
   
   # Edite .env com suas configurações:
   # DB_HOST=localhost
   # DB_USER=root
   # DB_PASS=
   # DB_NAME=inkstation
   ```

### Passo 3: Criar Banco de Dados

1. **Via phpMyAdmin (Recomendado)**
   - Acesse http://localhost/phpmyadmin
   - Crie um novo banco de dados chamado `inkstation`
   - Selecione o banco e vá para a aba "SQL"
   - Cole o conteúdo do arquivo `database/schema.sql`
   - Execute

2. **Via Linha de Comando**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. **Verificar criação**
   ```sql
   USE inkstation;
   SHOW TABLES;
   ```

### Passo 4: Configurar Apache (se necessário)

Se o rewrite de URLs não funcionar, verifique o arquivo `.htaccess` na pasta `public/`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /inkstation/public/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.php [QSA,L]
</IfModule>
```

### Passo 5: Testar a Instalação

Acesse em seu navegador:
```
http://localhost/inkstation/public/
```

Você deve receber um erro 404 (esperado, pois não há rota raiz):
```json
{
  "success": false,
  "status": 404,
  "message": "Endpoint not found"
}
```

## 📡 API Endpoints

### Autenticação

#### Registrar Novo Usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "nome_artistico": "Artista Silva",
  "email": "artista@example.com",
  "senha": "senha123456",
  "confirmar_senha": "senha123456"
}
```

**Resposta (201 Created)**:
```json
{
  "success": true,
  "status": 201,
  "message": "Usuário criado com sucesso",
  "data": {
    "id": 1,
    "nome_artistico": "Artista Silva",
    "email": "artista@example.com",
    "created_at": "2026-08-25 10:30:00"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "artista@example.com",
  "senha": "senha123456"
}
```

**Resposta (200 OK)**:
```json
{
  "success": true,
  "status": 200,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "nome_artistico": "Artista Silva",
      "email": "artista@example.com"
    },
    "token": "abc123def456..."
  }
}
```

#### Obter Usuário Atual
```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Resposta (200 OK)**:
```json
{
  "success": true,
  "status": 200,
  "message": "Sucesso",
  "data": {
    "id": 1,
    "nome_artistico": "Artista Silva",
    "email": "artista@example.com",
    "created_at": "2026-08-25 10:30:00"
  }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Resposta (200 OK)**:
```json
{
  "success": true,
  "status": 200,
  "message": "Logout realizado com sucesso",
  "data": null
}
```

### Estações de Trabalho

#### Listar Todas as Estações
```http
GET /api/estacoes
```

**Resposta (200 OK)**:
```json
{
  "success": true,
  "status": 200,
  "message": "Sucesso",
  "data": [
    {
      "id": 1,
      "nome": "Estação Premium 01",
      "categoria": "Premium",
      "descricao": "Estação de trabalho premium...",
      "preco_por_hora": 35.00,
      "imagem_url": "https://example.com/...",
      "recursos": ["Cadeira ergonômica", "Iluminação LED", ...],
      "ativa": 1,
      "created_at": "2026-08-25 10:00:00"
    }
  ]
}
```

#### Obter Detalhes da Estação
```http
GET /api/estacoes/{id}
```

**Resposta (200 OK)**:
```json
{
  "success": true,
  "status": 200,
  "message": "Sucesso",
  "data": {
    "id": 1,
    "nome": "Estação Premium 01",
    "categoria": "Premium",
    ...
  }
}
```

#### Verificar Disponibilidade
```http
GET /api/estacoes/{id}/disponibilidade?data=2026-08-25
```

**Resposta (200 OK)**:
```json
{
  "success": true,
  "status": 200,
  "message": "Sucesso",
  "data": {
    "data": "2026-08-25",
    "estacao_id": 1,
    "horarios_ocupados": [
      {
        "horario_inicio": "09:00",
        "horario_fim": "13:00"
      }
    ],
    "horarios_disponiveis": [
      {
        "inicio": "08:00",
        "fim": "09:00"
      },
      {
        "inicio": "13:00",
        "fim": "22:00"
      }
    ]
  }
}
```

### Reservas

#### Listar Reservas do Usuário
```http
GET /api/reservas
Authorization: Bearer {token}
```

**Resposta (200 OK)**:
```json
{
  "success": true,
  "status": 200,
  "message": "Sucesso",
  "data": [
    {
      "id": 1,
      "usuario_id": 1,
      "estacao_id": 1,
      "estacao_nome": "Estação Premium 01",
      "data": "2026-08-25",
      "horario_inicio": "09:00",
      "horario_fim": "13:00",
      "duracao": 4,
      "valor_total": 140.00,
      "observacoes": "Sessão de realismo",
      "status": "confirmada",
      "created_at": "2026-08-25 10:30:00"
    }
  ]
}
```

#### Criar Reserva
```http
POST /api/reservas
Authorization: Bearer {token}
Content-Type: application/json

{
  "estacao_id": 1,
  "data": "2026-08-25",
  "horario_inicio": "09:00",
  "horario_fim": "13:00",
  "observacoes": "Sessão de realismo"
}
```

**Resposta (201 Created)**:
```json
{
  "success": true,
  "status": 201,
  "message": "Reserva criada com sucesso",
  "data": {
    "id": 1,
    "usuario_id": 1,
    "estacao_id": 1,
    "data": "2026-08-25",
    "horario_inicio": "09:00",
    "horario_fim": "13:00",
    "duracao": 4,
    "valor_total": 140.00,
    "observacoes": "Sessão de realismo",
    "status": "confirmada",
    "created_at": "2026-08-25 10:30:00"
  }
}
```

#### Obter Detalhes da Reserva
```http
GET /api/reservas/{id}
Authorization: Bearer {token}
```

#### Cancelar Reserva
```http
PATCH /api/reservas/{id}/cancelar
Authorization: Bearer {token}
```

**Resposta (200 OK)**:
```json
{
  "success": true,
  "status": 200,
  "message": "Reserva cancelada com sucesso",
  "data": {
    "id": 1,
    "status": "cancelada",
    ...
  }
}
```

## 🔐 Segurança

### Senhas
- Protegidas com `password_hash()` usando algoritmo bcrypt
- Nunca armazenadas em texto plano
- Verificadas com `password_verify()`

### SQL Injection
- Uso obrigatório de prepared statements com PDO
- Todos os parâmetros ligados com `:nome`
- Sem concatenação de strings em queries

### Autenticação
- Tokens Bearer com expiração configurável
- Sessions PHP como fallback
- Validação em cada request autenticado

### CORS
- Configurável no `public/index.php`
- Permite requisições de múltiplas origens
- Valida origem na produção

### Validação
- Validação rigorosa de entrada
- Sanitização de dados JSON
- Tratamento de erros sem exposição de detalhes sensíveis

## 🧪 Testando a API

### Com cURL

```bash
# Registrar usuário
curl -X POST http://localhost/inkstation/public/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome_artistico": "Test Artist",
    "email": "test@example.com",
    "senha": "password123",
    "confirmar_senha": "password123"
  }'

# Login
curl -X POST http://localhost/inkstation/public/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "senha": "password123"
  }'

# Listar estações
curl http://localhost/inkstation/public/api/estacoes

# Criar reserva (substituir TOKEN)
curl -X POST http://localhost/inkstation/public/api/reservas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -d '{
    "estacao_id": 1,
    "data": "2026-08-25",
    "horario_inicio": "09:00",
    "horario_fim": "13:00",
    "observacoes": "Sessão de realismo"
  }'
```

### Com Postman

1. Importe as requisições de exemplo
2. Configure a variável `{{base_url}}` como `http://localhost/inkstation/public/api`
3. Use a variável `{{token}}` que será salva automaticamente após login

### Com JavaScript/Fetch

Consulte o arquivo `examples/api-examples.js` para exemplos completos de uso com fetch().

## 🔗 Integração com Angular

### Passo 1: Criar um Serviço HTTP

```typescript
// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost/inkstation/public/api';
  private token = localStorage.getItem('authToken');

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    });
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, data);
  }

  login(email: string, senha: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, { email, senha });
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/me`, {
      headers: this.getHeaders()
    });
  }

  getWorkstations(): Observable<any> {
    return this.http.get(`${this.baseUrl}/estacoes`);
  }

  getReservations(): Observable<any> {
    return this.http.get(`${this.baseUrl}/reservas`, {
      headers: this.getHeaders()
    });
  }

  createReservation(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/reservas`, data, {
      headers: this.getHeaders()
    });
  }

  cancelReservation(id: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/reservas/${id}/cancelar`, {}, {
      headers: this.getHeaders()
    });
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
  }
}
```

### Passo 2: Usar em Componentes

```typescript
// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  senha = '';
  erro = '';

  constructor(private api: ApiService, private router: Router) {}

  login() {
    this.api.login(this.email, this.senha).subscribe(
      response => {
        this.api.setToken(response.data.token);
        this.router.navigate(['/reservas']);
      },
      error => {
        this.erro = error.error.message || 'Erro ao fazer login';
      }
    );
  }
}
```

## 🔗 Integração com React

### Passo 1: Criar um Hook

```javascript
// src/hooks/useApi.js
import { useState } from 'react';

const API_BASE_URL = 'http://localhost/inkstation/public/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiRequest = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API Error');
      }

      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { apiRequest, loading, error };
}
```

### Passo 2: Usar em Componentes

```javascript
// src/components/LoginComponent.js
import { useState } from 'react';
import { useApi } from '../hooks/useApi';

export function LoginComponent() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const { apiRequest, error } = useApi();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
      });

      localStorage.setItem('authToken', response.token);
      // Redirecionar para dashboard
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-mail"
      />
      <input 
        type="password" 
        value={senha} 
        onChange={(e) => setSenha(e.target.value)}
        placeholder="Senha"
      />
      <button type="submit">Login</button>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </form>
  );
}
```

## 📊 Códigos de Status HTTP

| Código | Significado |
|--------|------------|
| 200 | Operação realizada com sucesso |
| 201 | Usuário ou reserva criada |
| 400 | Dados inválidos |
| 401 | Usuário não autenticado |
| 403 | Sem permissão |
| 404 | Registro não encontrado |
| 409 | Conflito (ex: e-mail já existe, horário ocupado) |
| 500 | Erro interno do servidor |

## 🐛 Troubleshooting

### Erro: "404 Not Found" em todos os endpoints

**Solução**: Verifique se o arquivo `.htaccess` está na pasta `public/` e se o módulo `mod_rewrite` está habilitado no Apache.

```bash
# Habilitar mod_rewrite
# No XAMPP: Edite C:\xampp\apache\conf\httpd.conf
# Procure por #LoadModule rewrite_module
# Descomente removendo o #
```

### Erro: "CORS error" no navegador

**Solução**: Os headers CORS já estão configurados no `public/index.php`. Se ainda não funcionar, verifique a origem no seu navegador:

```javascript
// No console do navegador
fetch('http://localhost/inkstation/public/api/estacoes')
  .then(r => r.json())
  .then(d => console.log(d));
```

### Erro: "Conexão recusada" ao banco de dados

**Solução**:
1. Verifique se MySQL está rodando no XAMPP
2. Verifique as credenciais no arquivo `.env`
3. Verifique se o banco de dados foi criado

```sql
-- No phpMyAdmin ou MySQL CLI
SHOW DATABASES;
USE inkstation;
SHOW TABLES;
```

### Erro: "Token inválido" ou "401 Unauthorized"

**Solução**:
1. Faça login novamente para obter um token válido
2. Verifique se o token está sendo enviado corretamente no header `Authorization: Bearer {token}`
3. Verifique a expiração do token (7 dias por padrão)

## 📚 Recursos Adicionais

- **Documentação PHP PDO**: https://www.php.net/manual/en/book.pdo.php
- **Segurança em PHP**: https://www.php.net/manual/en/security.php
- **CORS MDN**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

## 📝 Próximos Passos

1. **Implementar Google OAuth**
   - Obter credenciais em Google Cloud Console
   - Implementar verificação de token no endpoint `/api/auth/google`

2. **Adicionar Testes Unitários**
   - Usar PHPUnit para testes
   - Criar testes para controllers e validators

3. **Implementar Rate Limiting**
   - Limitar requisições por IP
   - Prevenir abuso de API

4. **Adicionar Logging**
   - Log de todas as operações
   - Audit trail para reservas

5. **Deployar em Produção**
   - Configurar HTTPS
   - Usar variáveis de ambiente
   - Configurar firewall

## 📄 Licença

Este projeto está sob licença MIT.

## 👨‍💻 Desenvolvido Por

Sistema de Gerenciamento de Estações - InkStation
