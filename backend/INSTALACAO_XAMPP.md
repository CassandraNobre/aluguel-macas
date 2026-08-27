# Guia de Instalação - InkStation no XAMPP

## 📦 Pré-requisitos

- XAMPP 7.4+ (com PHP 7.4+, Apache, MySQL)
- Navegador web
- Cliente HTTP (Postman, curl, ou navegador)

## 🚀 Passo a Passo de Instalação

### PASSO 1: Preparar o XAMPP

#### 1.1 - Baixar e instalar XAMPP
- Acesse: https://www.apachefriends.org/
- Baixe XAMPP 7.4 (ou versão mais recente)
- Execute o instalador
- Instale em: `C:\xampp\` (padrão)

#### 1.2 - Iniciar XAMPP
1. Abra `C:\xampp\xampp-control.exe`
2. Clique em "Start" ao lado de **Apache**
3. Clique em "Start" ao lado de **MySQL**
4. Aguarde até que ambos fiquem com luz verde

```
Apache      [Start] [Stop]  ✅ Running
MySQL       [Start] [Stop]  ✅ Running
```

#### 1.3 - Verificar instalação
- Abra navegador
- Acesse: http://localhost
- Você deve ver a página do XAMPP

---

### PASSO 2: Preparar o Projeto

#### 2.1 - Copiar arquivos
1. Copie a pasta `inkstation-backend` para:
   ```
   C:\xampp\htdocs\inkstation
   ```

A estrutura deve ficar assim:
```
C:\xampp\htdocs\
├── inkstation/
│   ├── public/
│   │   ├── index.php
│   │   └── .htaccess
│   ├── config/
│   ├── controllers/
│   ├── utils/
│   ├── database/
│   │   └── schema.sql
│   ├── examples/
│   ├── .env.example
│   ├── README.md
│   └── TESTING.md
```

#### 2.2 - Criar arquivo .env
1. Abra `C:\xampp\htdocs\inkstation\.env.example`
2. Salve como `C:\xampp\htdocs\inkstation\.env`
3. Deixe as configurações padrão:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=inkstation
   DB_PORT=3306
   ```

---

### PASSO 3: Configurar Apache (Rewrite)

#### 3.1 - Habilitar mod_rewrite

1. Abra `C:\xampp\apache\conf\httpd.conf` com um editor
2. Procure por:
   ```
   #LoadModule rewrite_module modules/mod_rewrite.so
   ```
3. Remova o `#` no início:
   ```
   LoadModule rewrite_module modules/mod_rewrite.so
   ```
4. Salve o arquivo

#### 3.2 - Reiniciar Apache
1. No painel XAMPP, clique em "Stop" para Apache
2. Aguarde 3 segundos
3. Clique em "Start" para Apache
4. Aguarde até ficar verde

#### 3.3 - Verificar .htaccess
Certifique-se de que o arquivo `public/.htaccess` existe e contém:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /inkstation/public/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.php [QSA,L]
</IfModule>
```

---

### PASSO 4: Criar Banco de Dados

#### 4.1 - Acessar phpMyAdmin
1. Abra navegador
2. Acesse: http://localhost/phpmyadmin
3. Login padrão:
   - Usuário: `root`
   - Senha: (deixe em branco)
   - Clique em "Acessar"

#### 4.2 - Criar banco de dados
1. Clique em "Novo" no painel esquerdo
2. Digite nome do banco: `inkstation`
3. Collation: `utf8mb4_unicode_ci`
4. Clique em "Criar"

#### 4.3 - Executar script SQL
1. Selecione o banco `inkstation` (clique no nome à esquerda)
2. Clique na aba "SQL"
3. Abra o arquivo `database/schema.sql` em um editor
4. Copie TODO o conteúdo
5. Cole no campo SQL do phpMyAdmin
6. Clique em "Executar"

Você deve ver mensagens de sucesso:
```
✅ Tabelas criadas com sucesso
✅ Dados inseridos
✅ Procedimentos criados
```

#### 4.4 - Verificar tabelas
1. No painel esquerdo, expanda `inkstation`
2. Você deve ver:
   - ✅ usuarios
   - ✅ estacoes
   - ✅ reservas
   - ✅ auth_tokens
   - ✅ audit_logs

---

### PASSO 5: Testar a API

#### 5.1 - Teste básico (navegador)
1. Abra navegador
2. Acesse: http://localhost/inkstation/public/api/estacoes
3. Você deve ver uma resposta JSON:
   ```json
   {
     "success": true,
     "data": [
       { "id": 1, "nome": "Estação Premium 01", ... }
     ]
   }
   ```

#### 5.2 - Teste com cURL
Abra PowerShell ou CMD:

```bash
# Teste 1: Listar estações
curl http://localhost/inkstation/public/api/estacoes

# Teste 2: Registrar usuário
curl -X POST http://localhost/inkstation/public/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"nome_artistico\": \"Test\", \"email\": \"test@example.com\", \"senha\": \"senha123456\", \"confirmar_senha\": \"senha123456\"}"

# Teste 3: Login
curl -X POST http://localhost/inkstation/public/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"artista@example.com\", \"senha\": \"senha123456\"}"
```

#### 5.3 - Teste com Postman
1. Baixe Postman: https://www.postman.com/downloads/
2. Abra Postman
3. Clique em "Import"
4. Selecione o arquivo `inkstation.postman_collection.json`
5. Defina variáveis:
   - `base_url`: http://localhost/inkstation/public/api
   - `estacao_id`: 1
   - `data_teste`: 2026-08-25
6. Comece pelos testes

---

### PASSO 6: Troubleshooting

#### ❌ Erro 404 em todos os endpoints

**Solução:**
1. Verifique se `.htaccess` existe em `public/`
2. Verifique se `mod_rewrite` está habilitado:
   - Abra phpMyAdmin: http://localhost/phpmyadmin
   - Clique em "Variáveis de servidor" (aba superior)
   - Procure por `mod_rewrite`
   - Deve estar habilitado (✅)

Se não estiver habilitado:
1. Abra `C:\xampp\apache\conf\httpd.conf`
2. Descomente: `LoadModule rewrite_module modules/mod_rewrite.so`
3. Reinicie Apache

#### ❌ Erro: "Conexão recusada ao banco de dados"

**Solução:**
1. Verifique se MySQL está rodando (deve estar verde no XAMPP)
2. Verifique credenciais no `.env`:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=inkstation
   ```
3. Teste conexão:
   - Acesse http://localhost/phpmyadmin
   - Se funciona, o banco está OK

#### ❌ Erro 403 ao acessar

**Solução:**
1. Verifique permissões da pasta:
   ```bash
   icacls "C:\xampp\htdocs\inkstation" /grant Users:F /T
   ```
2. Reinicie Apache

#### ❌ Erro ao habilitar rewrite no httpd.conf

**Solução alternativa:**
1. Crie arquivo `.htaccess` na pasta `public/`
2. Se não funcionar, seu Apache pode não suportar rewrite
3. Nesse caso, acesse a API assim:
   ```
   http://localhost/inkstation/public/index.php/api/estacoes
   ```

#### ❌ Token inválido mesmo após login

**Solução:**
1. Verifique se tabela `auth_tokens` foi criada:
   - phpMyAdmin → inkstation → auth_tokens
2. Verifique se token está sendo salvo corretamente:
   - Resposta do login deve incluir: `"token": "abc123..."`

---

### PASSO 7: Usar a API

#### Via Navegador (Leitura)
```
http://localhost/inkstation/public/api/estacoes
```

#### Via cURL (Qualquer operação)
```bash
# Registrar
curl -X POST http://localhost/inkstation/public/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"nome_artistico\":\"Artist\",\"email\":\"test@test.com\",\"senha\":\"senha123456\",\"confirmar_senha\":\"senha123456\"}"
```

#### Via Postman (Recomendado)
1. Importe a coleção: `inkstation.postman_collection.json`
2. Configure ambiente com base_url
3. Execute os testes na ordem

#### Via JavaScript/Fetch (Para Angular/React)
Consulte: `examples/api-examples.js`

---

### PASSO 8: Configuração Final (Opcional)

#### 8.1 - Configurar Virtual Host (para URL bonita)
1. Edite `C:\xampp\apache\conf\extra\httpd-vhosts.conf`
2. Adicione:
   ```apache
   <VirtualHost *:80>
       ServerName inkstation.local
       DocumentRoot "C:/xampp/htdocs/inkstation/public"
       <Directory "C:/xampp/htdocs/inkstation/public">
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```
3. Edite `C:\Windows\System32\drivers\etc\hosts`:
   ```
   127.0.0.1 inkstation.local
   ```
4. Reinicie Apache
5. Acesse: http://inkstation.local/api/estacoes

#### 8.2 - Configurar banco de dados remoto (produção)
1. Edite `.env`:
   ```
   DB_HOST=seu-servidor.com
   DB_USER=usuario_producao
   DB_PASS=senha_segura
   DB_NAME=inkstation_prod
   ```
2. Execute script SQL no servidor remoto

---

## ✅ Checklist Final

- [ ] XAMPP instalado e rodando
- [ ] Apache com luz verde
- [ ] MySQL com luz verde
- [ ] Pasta inkstation em C:\xampp\htdocs\
- [ ] Arquivo .env configurado
- [ ] mod_rewrite habilitado
- [ ] Banco de dados criado
- [ ] Tabelas criadas via schema.sql
- [ ] Teste /api/estacoes retorna JSON
- [ ] Postman importado e funcionando
- [ ] Posso fazer login com artista@example.com

---

## 📞 Contato / Suporte

Se encontrar erros:
1. Verifique logs: `C:\xampp\apache\logs\error.log`
2. Abra DevTools (F12) no navegador
3. Consulte README.md para mais detalhes
4. Verifique TESTING.md para guia de testes

---

## 🎉 Pronto!

Sua API está funcionando! Agora você pode:
- ✅ Testar endpoints com Postman
- ✅ Integrar com Angular/React
- ✅ Executar exemplos JavaScript
- ✅ Criar reservas e gerenciar estações
