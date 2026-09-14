# API do InkStation

Back-end REST do InkStation, responsável por autenticação, catálogo de estações, reservas, pagamentos e upload de imagens.

## Stack

- Node.js 20+
- Express
- PostgreSQL (`pg`)
- JWT para autenticação
- Multer para upload de imagens
- bcryptjs para hash de senhas

## Instalação

Na raiz do projeto:

```bash
npm install --prefix backend
```

Crie `backend/.env` a partir de `backend/.env.example` e preencha as credenciais do PostgreSQL. O arquivo `.env` não deve ser versionado.

## Execução

```bash
cd backend
npm start
```

Por padrão, a API fica em `http://localhost:3000`. O endpoint `GET /health` confirma se o servidor está ativo.

## Endpoints

### Públicos

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/estacoes`
- `GET /api/estacoes/:id`

### Autenticados

Enviar `Authorization: Bearer TOKEN`:

- `GET /api/reservas`
- `POST /api/reservas`
- `PATCH /api/reservas/:id/cancelar`
- Rotas de cadastro e edição de estações, conforme o perfil do usuário.

## Testes e integração

A coleção para testes manuais está em `inkstation.postman_collection.json`. O front-end consome a API por meio dos serviços em `frontend/src/app/services`.

Para validar a sintaxe do servidor:

```bash
node --check src/server.js
```

## Documentação relacionada

- [README principal](../README.md)
- [DER do sistema](../docs/DER.md)
- [Configuração no Render](RENDER_SETUP.md)
- [Testes](TESTING.md)
