# Roteiro de demonstração — Sprint 02

## Preparação

1. Crie um banco PostgreSQL e execute `backend/database/schema-postgresql.sql`.
2. Configure `DATABASE_URL` em `backend/.env`.
3. Execute `npm run install:all` e depois `npm start` na raiz.
4. Confirme `http://localhost:3000/health` e `http://localhost:4200`.

## Cenário da apresentação

1. Cadastre um usuário e faça login.
2. Cadastre uma estação informando nome, categoria, descrição, preço, recursos e imagem.
3. Mostre a estação no catálogo e use a pesquisa, categoria e preço máximo.
4. Edite a estação e confirme a alteração no banco.
5. Crie uma reserva escolhendo data e horário.
6. Tente criar outra reserva no mesmo horário e mostre a mensagem de conflito.
7. Liste, atualize, cancele e exclua a reserva.
8. Atualize a página e confirme que os dados persistiram no PostgreSQL.

## Evidências para anexar

- Print do DER atualizado.
- Print do PostgreSQL mostrando as cinco tabelas e registros persistidos.
- Prints do cadastro, edição e exclusão de estação.
- Prints da criação, conflito, cancelamento e exclusão de reserva.
- Print do histórico do GitHub com os commits de cada integrante.
- Link do Trello com backlog, responsáveis e tarefas concluídas.

## Commits e Trello

Cada integrante deve realizar pelo menos três commits usando sua própria conta GitHub. No Trello, registrar uma tarefa por requisito, responsável, status e evidência anexada.
