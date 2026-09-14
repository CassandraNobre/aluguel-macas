# Documento de entrega — InkStation

## 1. Objetivo

O InkStation é uma plataforma de coworking para tatuadores reservarem estações de trabalho em estúdios especializados.

## 2. Atendimento aos requisitos

### Stack tecnológica

- **Front-end:** Angular 21, TypeScript, HTML e SCSS.
- **Back-end:** Node.js e Express.
- **Banco de dados:** PostgreSQL.
- **Autenticação:** JWT, cadastro, login e recuperação de senha.

### Estrutura inicial

O projeto está organizado em `frontend/`, `backend/` e `docs/`. As telas Angular ficam em `frontend/src/app/pages`, os serviços em `frontend/src/app/services` e a API em `backend/src`.

### Descrição do sistema

O sistema conecta tatuadores a estações de trabalho compartilhadas. O usuário consulta o catálogo, escolhe uma estação, agenda um período e acompanha o status da reserva.

### Requisitos funcionais implementados

1. Cadastro e autenticação de usuários.
2. Recuperação de senha.
3. Consulta do catálogo de estações.
4. Cadastro e edição de estações.
5. Upload e exibição de imagens.
6. Criação de reservas com data e horário.
7. Consulta e cancelamento de reservas.
8. Consulta de reservas pagas.
9. Chatbot de atendimento.

### Modelagem do banco de dados

O [DER](DER.md) contém as entidades `USUARIOS`, `ESTACOES`, `RESERVAS`, `AUTH_TOKENS` e `AUDIT_LOGS`, atendendo ao requisito mínimo de três entidades.

### Protótipo e telas principais

- Login, cadastro e recuperação de senha.
- Catálogo de estações.
- Agendamento.
- Minhas reservas.
- Reservas pagas.
- Cadastro de estação.

### Funcionamento e navegação

O front-end inicia em `/login` e possui navegação protegida para catálogo, agendamento e reservas. O back-end disponibiliza o health check em `/health` e as rotas REST documentadas no README principal.

## 3. Como executar para demonstração

```bash
npm run install:all
npm start
```

Acesse `http://localhost:4200` e verifique a API em `http://localhost:3000/health`.

## 4. Evidências recomendadas

- [Repositório GitHub](https://github.com/CassandraNobre/aluguel-macas).
- Histórico de commits individuais de cada integrante.
- [Quadro Trello](https://trello.com/b/L8hmVO5h/aluguel-maca-tatoo).
- Capturas das telas de login, catálogo e agendamento.
- Captura ou link do DER.
- Demonstração da navegação entre login, catálogo, agendamento e reservas.

## 5. Checklist final

- [x] Stack tecnológica definida.
- [x] Estrutura inicial organizada.
- [x] Objetivo e público-alvo descritos.
- [x] Pelo menos cinco requisitos funcionais documentados.
- [x] DER com pelo menos três entidades.
- [x] Mais de três telas disponíveis.
- [x] Abertura da aplicação e navegação básica funcionando.
- [ ] Commits individuais de todos os integrantes comprovados no GitHub.
- [x] Link do quadro Trello adicionado.

Os commits individuais ainda devem ser conferidos no histórico do GitHub antes da entrega.
