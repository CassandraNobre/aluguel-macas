# InkStation

Sistema de coworking para tatuadores, desenvolvido para consulta, reserva e acompanhamento do aluguel de estações de trabalho.

## Objetivo e público-alvo

O InkStation permite que tatuadores encontrem uma estação adequada, consultem preço e recursos, escolham data e horário e acompanhem suas reservas e pagamentos. O público-alvo são tatuadores autônomos, profissionais de tatuagem e administradores de estúdios compartilhados.

## Requisitos funcionais

- Cadastrar usuários, realizar login e recuperar a senha.
- Exibir o catálogo de estações com imagens, recursos e preço por hora.
- Permitir que usuários autorizados cadastrem e editem estações.
- Permitir escolher uma estação, data e horário para criar uma reserva.
- Listar, acompanhar e cancelar reservas.
- Exibir reservas pagas e informações de pagamento.
- Disponibilizar um chatbot para dúvidas sobre o sistema.

## Stack tecnológica

- **Front-end:** Angular 21, TypeScript, HTML e SCSS.
- **Back-end:** Node.js, Express, JWT, Multer e bcryptjs.
- **Banco de dados:** PostgreSQL, acessado pelo pacote `pg`.
- **Hospedagem prevista:** front-end compatível com Vercel e back-end compatível com Render.

## Estrutura do projeto

```text
aluguel-macas/
├── frontend/              Aplicação Angular
│   └── src/app/            Páginas, serviços e componentes
├── backend/               API REST em Node.js
│   ├── src/                Servidor, rotas e controladores
│   └── uploads/            Imagens das estações
├── docs/                   DER e documentação de entrega
└── test-completo.js        Teste de integração
```

## Banco de dados

O modelo inicial está em [docs/DER.md](docs/DER.md). As entidades principais são `usuarios`, `estacoes` e `reservas`; o modelo também prevê tokens de autenticação e registros de auditoria.

## Como executar

### Pré-requisitos

- Node.js 20 ou superior.
- PostgreSQL configurado para o back-end.
- Variáveis de ambiente preenchidas em `backend/.env`, usando `backend/.env.example` como referência.

### Execução completa

Na raiz do projeto:

```bash
npm run install:all
npm start
```

O front-end ficará disponível em `http://localhost:4200` e a API em `http://localhost:3000`.

### Execução separada

```bash
cd backend
npm install
npm start
```

```bash
cd frontend
npm install
npm start
```

O health check da API é `GET http://localhost:3000/health`.

## Rotas principais da API

- `POST /api/auth/login` — autenticação.
- `POST /api/auth/register` — cadastro de usuário.
- `GET /api/estacoes` — catálogo de estações.
- `GET /api/estacoes/:id` — detalhes de uma estação.
- `GET /api/reservas` — reservas do usuário autenticado.
- `POST /api/reservas` — criação de reserva.
- `PATCH /api/reservas/:id/cancelar` — cancelamento de reserva.

As rotas protegidas usam `Authorization: Bearer TOKEN`.

## Rotas do front-end

`/login` · `/catalogo` · `/agendamento` · `/minhas-reservas` · `/reservas-pagas` · `/cadastro-estacao`

## Validação

```bash
npm run check:backend
npm run build
cd frontend
npm test -- --watch=false
```

## Segurança

Não versione arquivos `.env`, senhas, tokens ou chaves de provedores externos. Use apenas valores de teste no arquivo `CREDENCIAIS_TESTE.md`.

## Documentos complementares

- [Documento de entrega](docs/entrega.md)
- [Diagrama entidade-relacionamento](docs/DER.md)
- [DER em Mermaid](docs/DER.mmd)
- [Documentação do back-end](backend/README.md)

## Links do projeto

- [Repositório no GitHub](https://github.com/CassandraNobre/aluguel-macas)
- [Quadro do Trello](https://trello.com/b/L8hmVO5h/aluguel-maca-tatoo)
