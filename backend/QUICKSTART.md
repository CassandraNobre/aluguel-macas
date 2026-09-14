# Início rápido do back-end

## 1. Instalar dependências

```bash
cd backend
npm install
```

## 2. Configurar o ambiente

Copie `.env.example` para `.env` e informe a conexão do PostgreSQL, a porta da API e o segredo usado para assinar os tokens JWT.

## 3. Iniciar a API

```bash
npm start
```

Verifique em `http://localhost:3000/health`.

## 4. Testar o fluxo principal

1. Cadastre um usuário em `POST /api/auth/register`.
2. Faça login em `POST /api/auth/login`.
3. Use o token retornado como `Authorization: Bearer TOKEN`.
4. Consulte estações em `GET /api/estacoes`.
5. Crie uma reserva em `POST /api/reservas`.
6. Consulte ou cancele a reserva nas rotas correspondentes.

Para exemplos completos, use `inkstation.postman_collection.json`.
