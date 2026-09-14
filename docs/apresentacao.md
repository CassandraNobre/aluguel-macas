# Roteiro de apresentação — InkStation

## Ordem sugerida

1. Apresentar o objetivo: facilitar o aluguel de estações para tatuadores.
2. Mostrar a tela de login e o cadastro de usuário.
3. Acessar o catálogo e apresentar imagens, recursos e preço das estações.
4. Selecionar uma estação e demonstrar o agendamento de data e horário.
5. Mostrar **Minhas reservas**, o status da reserva e a opção de cancelamento.
6. Mostrar **Reservas pagas** e o chatbot de atendimento.
7. Apresentar o DER em [DER.md](DER.md).
8. Apresentar o [histórico de commits do GitHub](https://github.com/CassandraNobre/aluguel-macas/commits) e o [quadro do Trello](https://trello.com/b/L8hmVO5h/aluguel-maca-tatoo).

## Evidências para reunir

- [x] [Link do repositório GitHub](https://github.com/CassandraNobre/aluguel-macas).
- [ ] Commits individuais de cada integrante, com nome e data.
- [x] [Link ou capturas do Trello](https://trello.com/b/L8hmVO5h/aluguel-maca-tatoo).
- [ ] Captura da tela de login.
- [ ] Captura do catálogo.
- [ ] Captura do agendamento.
- [ ] Captura de minhas reservas.
- [ ] Captura do DER.
- [ ] URL publicada, se houver.

## Verificação antes da apresentação

```bash
npm run check:backend
npm run build
```

Em uma segunda janela, execute `npm start`, abra `http://localhost:4200` e confirme o health check em `http://localhost:3000/health`.

## Observação

Os links do GitHub, Trello e da publicação devem ser preenchidos pela equipe, pois são informações externas ao código-fonte.
