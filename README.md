# InkStation

Sistema de coworking para tatuadores reservarem estações de trabalho.

## Estrutura

```text
aluguel-macas/
├── frontend/       # Aplicação Angular
├── backend/        # API a ser adicionada
└── README.md
```
O backend Node.js está em `backend/` e expõe a API REST em `/api`. Em produção,
a URL pública é `https://inkstation-backend.onrender.com/api`.

### Backend local

```bash
cd backend
npm install
npm start
```

A API local fica disponível em `http://localhost:3000`. O health check é
`http://localhost:3000/health`.

Endpoints principais:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/estacoes`
- `GET /api/estacoes/:id`
- `GET /api/reservas`
- `POST /api/reservas`
- `PATCH /api/reservas/:id/cancelar`
- `POST /api/chatbot`

As rotas protegidas usam `Authorization: Bearer TOKEN`. Copie `backend/.env.example`
para `backend/.env` e preencha as variáveis localmente. Nunca versione o arquivo
`.env` com senhas, tokens ou chaves de provedores de IA.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.21.

## Development server

Entre na pasta do frontend antes de executar os comandos:

```bash
cd frontend
npm install
ng serve
```

Depois, abra `http://localhost:4200/`.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
cd frontend
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
cd frontend
ng build
```

O build será gerado em `frontend/dist/`.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
cd frontend
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
cd frontend
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
