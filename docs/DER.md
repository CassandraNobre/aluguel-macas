# DER - InkStation

Diagrama entidade-relacionamento inicial do sistema:

```mermaid
erDiagram
    USUARIOS ||--o{ RESERVAS : realiza
    ESTACOES ||--o{ RESERVAS : recebe
    USUARIOS ||--o{ AUTH_TOKENS : possui
    USUARIOS ||--o{ AUDIT_LOGS : gera

    USUARIOS {
        int id PK
        varchar nome
        varchar email UK
        varchar senha_hash
        varchar telefone
        varchar tipo_usuario
        boolean ativo
        timestamp criado_em
    }

    ESTACOES {
        int id PK
        varchar nome
        varchar tipo
        text descricao
        decimal preco
        varchar imagem
        json recursos
        boolean ativo
        timestamp criado_em
    }

    RESERVAS {
        int id PK
        int usuario_id FK
        int estacao_id FK
        date entrada_data
        time entrada_hora
        date saida_data
        time saida_hora
        varchar status
        timestamp criado_em
    }

    AUTH_TOKENS {
        int id PK
        int usuario_id FK
        varchar token_hash UK
        timestamp expires_at
    }

    AUDIT_LOGS {
        int id PK
        int usuario_id FK
        varchar acao
        varchar tabela
        int registro_id
        timestamp created_at
    }
```

## Relacionamentos

- Um usuario pode realizar varias reservas.
- Uma estacao pode receber varias reservas ao longo do tempo.
- Um usuario pode possuir varios tokens de autenticacao.
- Um usuario pode gerar varios registros de auditoria.
