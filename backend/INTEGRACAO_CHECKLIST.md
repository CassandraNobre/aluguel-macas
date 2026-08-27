# Checklist de Integração - Frontend Angular + Backend PHP

## 📋 Pré-Requisitos
- [ ] Backend PHP instalado e rodando (http://localhost/inkstation/public/api/estacoes)
- [ ] Banco de dados MySQL criado e preenchido
- [ ] Angular 21+ instalado
- [ ] Frontend Angular clonado (branch feature/frontend-inkstation)

---

## 🚀 Passo 1: Copiar Arquivos de Serviço

### 1.1 - AuthService
```
Copiar: examples/auth.service.ts
Para:   src/app/services/auth.service.ts
```

**Checklist:**
- [ ] Arquivo copiado
- [ ] HttpClient injetado
- [ ] API URL configurada para localhost
- [ ] LocalStorage keys definidos

### 1.2 - EstacaoService
```
Copiar: examples/estacao.service.ts
Para:   src/app/services/estacao.service.ts
```

**Checklist:**
- [ ] Arquivo criado (novo)
- [ ] Interfaces definidas
- [ ] API URL configurada
- [ ] 3 métodos implementados

### 1.3 - ReservasService
```
Copiar: examples/reservas.service.ts
Para:   src/app/services/reservas.service.ts
```

**Checklist:**
- [ ] Arquivo copiado
- [ ] Conversão de data configurada
- [ ] Conversão de horário configurada
- [ ] RxJS Observables implementados

---

## 🔄 Passo 2: Copiar Interceptor HTTP

### 2.1 - AuthInterceptor
```
Copiar: examples/auth.interceptor.ts
Para:   src/app/auth/auth.interceptor.ts
```

**Checklist:**
- [ ] Arquivo criado
- [ ] Adiciona Bearer token automaticamente
- [ ] Trata erro 401
- [ ] Redireciona para login em erro 401

---

## ⚙️ Passo 3: Configurar app.config.ts

### 3.1 - Atualizar configuração
```
Copiar: examples/app.config.ts
Para:   src/app/app.config.ts
```

**Checklist:**
- [ ] HttpClientModule importado
- [ ] AuthInterceptor registrado
- [ ] Routes configuradas

---

## 🔧 Passo 4: Atualizar Componentes

### 4.1 - LoginComponent
**Arquivo:** `src/app/pages/login/login.component.ts`

**Mudanças necessárias:**

**Antes (localStorage):**
```typescript
this.authService.entrar(email, senha, lembrar);
```

**Depois (Backend API):**
```typescript
this.authService.entrar(email, senha, lembrar).subscribe({
  next: (response) => {
    this.router.navigate(['/catalogo']);
  },
  error: (error) => {
    this.erro = error.error?.message || 'Erro ao fazer login';
  }
});
```

**Checklist:**
- [ ] Serviço injetado
- [ ] Subscribe adicionado
- [ ] Router injetado
- [ ] Tratamento de erro

### 4.2 - CatalogoComponent
**Arquivo:** `src/app/pages/catalogo/catalogo.component.ts`

**Mudanças necessárias:**

**Adicionar:**
```typescript
import { EstacaoService } from '../../services/estacao.service';

export class CatalogoComponent implements OnInit {
  estacoes: any[] = [];
  carregando = true;
  erro = '';

  constructor(private estacaoService: EstacaoService) {}

  ngOnInit(): void {
    this.carregarEstacoes();
  }

  carregarEstacoes(): void {
    this.estacaoService.listarEstacoes().subscribe({
      next: (response) => {
        if (response.success) {
          this.estacoes = response.data;
        }
        this.carregando = false;
      },
      error: (error) => {
        this.erro = 'Erro ao carregar estações';
        this.carregando = false;
      }
    });
  }
}
```

**Checklist:**
- [ ] EstacaoService injetado
- [ ] ngOnInit implementado
- [ ] Observable subscribe adicionado
- [ ] Tipos de dados atualizados

### 4.3 - AgendamentoComponent
**Arquivo:** `src/app/pages/agendamento/agendamento.component.ts`

**Mudanças necessárias:**

**Adicionar método para criar reserva:**
```typescript
criar(): void {
  if (!this.aceptouBiosseguranca) {
    this.erro = 'Aceite o termo de biossegurança';
    return;
  }

  this.carregando = true;
  this.erro = '';

  this.reservasService.adicionarReserva(
    this.estacao_id,
    this.data,
    this.horario_inicio,
    this.horario_fim,
    this.observacoes
  ).subscribe({
    next: () => {
      this.carregando = false;
      this.router.navigate(['/minhas-reservas']);
    },
    error: (error) => {
      this.carregando = false;
      this.erro = error.error?.message || 'Erro ao criar reserva';
    }
  });
}
```

**Adicionar método para verificar conflito:**
```typescript
verificarConflito(): void {
  this.reservasService.temConflito(
    this.estacao_id,
    this.data,
    this.horario_inicio,
    this.horario_fim
  ).subscribe({
    next: (temConflito) => {
      this.temConflito = temConflito;
    }
  });
}
```

**Checklist:**
- [ ] ReservasService injetado
- [ ] Método criar() atualizado
- [ ] Método verificarConflito() adicionado
- [ ] Router injetado

### 4.4 - MinhasReservasComponent
**Arquivo:** `src/app/pages/minhas-reservas/minhas-reservas.component.ts`

**Mudanças necessárias:**

**Adicionar:**
```typescript
export class MinhasReservasComponent implements OnInit {
  reservas: Reserva[] = [];
  carregando = true;

  constructor(private reservasService: ReservasService) {}

  ngOnInit(): void {
    this.carregarReservas();
  }

  carregarReservas(): void {
    this.reservasService.reservas$.subscribe((reservas) => {
      this.reservas = reservas;
      this.carregando = false;
    });
    
    this.reservasService.carregarReservas();
  }

  cancelarReserva(id: number): void {
    this.reservasService.cancelarReserva(id).subscribe({
      next: () => {
        // Lista atualiza automaticamente via Observable
      },
      error: (error) => {
        console.error('Erro ao cancelar:', error);
      }
    });
  }
}
```

**Checklist:**
- [ ] ReservasService injetado
- [ ] Observable.subscribe adicionado
- [ ] carregarReservas() chamado em ngOnInit
- [ ] cancelarReserva() atualizado

### 4.5 - NavbarComponent (Logout)
**Arquivo:** `src/app/app.component.ts` ou navbar component

**Mudanças necessárias:**

**Antes:**
```typescript
this.authService.sair();
```

**Depois:**
```typescript
this.authService.sair().subscribe({
  next: () => {
    this.router.navigate(['/login']);
  }
});
```

**Checklist:**
- [ ] Subscribe adicionado
- [ ] Router injetado
- [ ] Redirecionamento após logout

---

## 🧪 Passo 5: Testar Integração

### 5.1 - Teste de Login
```bash
ng serve
# Acesse: http://localhost:4200/login
# Teste com: artista@example.com / senha123456
# Deve ir para /catalogo
```

**Checklist:**
- [ ] Login bem-sucedido
- [ ] Token salvo em localStorage
- [ ] Usuário redirecionado

### 5.2 - Teste de Catálogo
```
http://localhost:4200/catalogo
# Deve carregar estações do backend
# Verificar console (sem erros CORS)
```

**Checklist:**
- [ ] Estações carregadas
- [ ] Sem erros CORS
- [ ] Cards exibem dados corretos

### 5.3 - Teste de Agendamento
```
Clique em uma estação
# Deve ir para /agendamento?estacao_id=1
# Preencha o formulário
# Clique "Agendar"
```

**Checklist:**
- [ ] Formulário pré-carregado
- [ ] Validação de conflito funciona
- [ ] Reserva criada com sucesso
- [ ] Redirecionado para minhas reservas

### 5.4 - Teste de Minhas Reservas
```
http://localhost:4200/minhas-reservas
# Deve exibir suas reservas
# Cancelar uma reserva deve funcionar
```

**Checklist:**
- [ ] Reservas carregadas
- [ ] Cancelamento funciona
- [ ] Status atualiza

### 5.5 - Teste de Logout
```
Clique em "Sair" na navbar
# Deve limpar token
# Deve redirecionar para login
# Tente acessar /catalogo (deve redirecionar)
```

**Checklist:**
- [ ] Token removido
- [ ] Logout funciona
- [ ] AuthGuard protege rotas

---

## 🔐 Passo 6: Verificar Segurança

**Checklist:**
- [ ] Token salvo em localStorage (não em sessionStorage)
- [ ] Interceptor adiciona token em todas requisições
- [ ] Erro 401 faz logout
- [ ] AuthGuard protege rotas
- [ ] Senha não é salva em localStorage
- [ ] CORS funcionando

---

## 📊 Passo 7: Verificar Conversão de Dados

### Data
- [ ] Frontend envia: DD/MM/YYYY
- [ ] Backend recebe: YYYY-MM-DD
- [ ] Backend retorna: YYYY-MM-DD
- [ ] Frontend exibe: DD/MM/YYYY

### Status
- [ ] Frontend exibe: "Confirmada", "Cancelada", etc
- [ ] Backend usa: "confirmada", "cancelada", etc

### Valor
- [ ] Backend calcula: 140.00
- [ ] Frontend exibe: R$ 140,00

**Checklist:**
- [ ] Conversão automática nos serviços
- [ ] Sem erros de formato
- [ ] Dados consistentes

---

## ✅ Checklist Final

- [ ] Backend rodando (Apache + MySQL)
- [ ] Api respondendo (http://localhost/inkstation/public/api/estacoes)
- [ ] AuthService modificado
- [ ] EstacaoService criado
- [ ] ReservasService modificado
- [ ] AuthInterceptor criado
- [ ] app.config.ts atualizado
- [ ] LoginComponent atualizado
- [ ] CatalogoComponent atualizado
- [ ] AgendamentoComponent atualizado
- [ ] MinhasReservasComponent atualizado
- [ ] NavbarComponent/logout atualizado
- [ ] ng serve rodando sem erros
- [ ] Login funciona
- [ ] Catálogo carrega estações
- [ ] Agendamento cria reservas
- [ ] Minhas reservas carrega
- [ ] Cancelamento funciona
- [ ] Logout funciona
- [ ] AuthGuard protege rotas
- [ ] Sem erros CORS
- [ ] Sem erros no console

---

## 🐛 Troubleshooting

### Erro: "CORS policy"
**Causa:** Backend não configurado para CORS
**Solução:** Verificar headers em `public/index.php`

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
```

### Erro: "404 Not Found"
**Causa:** URL da API incorreta
**Solução:** Verificar `private apiUrl` em cada serviço

```typescript
private apiUrl = 'http://localhost/inkstation/public/api';
```

### Erro: "401 Unauthorized"
**Causa:** Token inválido ou expirado
**Solução:** Fazer logout e login novamente

### Erro: "Token is not defined"
**Causa:** Token não é string ou é null
**Solução:** Verificar localStorage.getItem()

```typescript
get token(): string | null {
  return localStorage.getItem(this.STORAGE_KEY);
}
```

---

## 📝 Próximos Passos

1. **Google OAuth Real**
   - [ ] Obter credenciais Google Cloud
   - [ ] Implementar real backend do Google

2. **Melhorias Frontend**
   - [ ] Loading spinners
   - [ ] Toast notifications
   - [ ] Debounce em verificação de conflito

3. **Melhorias Backend**
   - [ ] Email verification
   - [ ] Password reset
   - [ ] User profile page

---

**Pronto para integrar! 🚀**

Siga este checklist e sua integração será 100% bem-sucedida!
