# Exemplos de Uso dos Serviços

## 📚 Índice
1. [AuthService](#authservice)
2. [EstacaoService](#estacaoservice)
3. [ReservasService](#reservasservice)
4. [Tratamento de Erros](#tratamento-de-erros)

---

## AuthService

### Login
```typescript
// No componente
import { AuthService } from '../../services/auth.service';

export class LoginComponent {
  email = 'artista@example.com';
  senha = 'senha123456';
  lembrar = true;
  erro = '';

  constructor(private authService: AuthService, private router: Router) {}

  entrar(): void {
    this.authService.entrar(this.email, this.senha, this.lembrar).subscribe({
      next: (response) => {
        console.log('Login bem-sucedido:', response.data.user);
        this.router.navigate(['/catalogo']);
      },
      error: (error) => {
        this.erro = error.error?.message || 'E-mail ou senha incorretos';
        console.error('Erro:', error);
      }
    });
  }
}
```

### Cadastro
```typescript
cadastrar(): void {
  this.authService.cadastrar(
    'Tatuador XYZ', // nome_artistico
    'novo@example.com', // email
    'senha123456', // senha
    'senha123456' // confirmar_senha
  ).subscribe({
    next: (response) => {
      console.log('Cadastro bem-sucedido:', response.data);
      // Fazer login automaticamente
      this.entrar();
    },
    error: (error) => {
      this.erro = error.error?.message || 'Erro ao fazer cadastro';
    }
  });
}
```

### Verificar se está autenticado
```typescript
// No navbar ou componente
export class NavbarComponent {
  constructor(public authService: AuthService) {}

  // No template:
  // <ng-container *ngIf="authService.estaAutenticado">
  //   <p>Olá, {{ authService.usuario?.nome_artistico }}</p>
  // </ng-container>
}
```

### Observar mudanças de usuário
```typescript
export class ProfileComponent implements OnInit {
  usuario$ = this.authService.usuario$;

  constructor(private authService: AuthService) {}

  // No template:
  // <div *ngIf="usuario$ | async as usuario">
  //   <h2>{{ usuario.nome_artistico }}</h2>
  // </div>
}
```

### Logout
```typescript
sair(): void {
  this.authService.sair().subscribe({
    next: () => {
      console.log('Logout realizado');
      this.router.navigate(['/login']);
    },
    error: (error) => {
      console.error('Erro ao fazer logout:', error);
      // Mesmo assim, limpa dados locais
      this.router.navigate(['/login']);
    }
  });
}
```

### Acessar usuário atual
```typescript
get usuarioAtual() {
  return this.authService.usuario;
}

// Ou via Observable:
constructor(private authService: AuthService) {
  this.authService.usuario$.subscribe(usuario => {
    if (usuario) {
      console.log('Usuário logado:', usuario.nome_artistico);
    } else {
      console.log('Nenhum usuário logado');
    }
  });
}
```

---

## EstacaoService

### Listar todas as estações
```typescript
// No componente
import { EstacaoService } from '../../services/estacao.service';

export class CatalogoComponent implements OnInit {
  estacoes: any[] = [];
  carregando = true;
  erro = '';

  constructor(private estacaoService: EstacaoService) {}

  ngOnInit(): void {
    this.estacaoService.listarEstacoes().subscribe({
      next: (response) => {
        if (response.success) {
          this.estacoes = response.data; // Array de estações
          console.log('Estações carregadas:', this.estacoes);
        }
        this.carregando = false;
      },
      error: (error) => {
        this.erro = 'Erro ao carregar estações: ' + error.message;
        this.carregando = false;
      }
    });
  }
}
```

### Template para exibir estações
```html
<div *ngIf="carregando" class="loader">
  Carregando estações...
</div>

<div *ngIf="erro" class="erro-mensagem">
  {{ erro }}
</div>

<div *ngIf="!carregando && !erro" class="estacoes-grid">
  <div *ngFor="let estacao of estacoes" class="estacao-card">
    <img [src]="estacao.imagem_url" [alt]="estacao.nome" />
    <h3>{{ estacao.nome }}</h3>
    <p class="categoria">{{ estacao.categoria }}</p>
    <p class="descricao">{{ estacao.descricao }}</p>
    <p class="preco">R$ {{ estacao.preco_por_hora | number:'1.2-2' }}/hora</p>
    <button (click)="agendar(estacao.id)" class="btn-agendar">
      Agendar
    </button>
  </div>
</div>
```

### Obter estação específica
```typescript
obterDetalhes(id: number): void {
  this.estacaoService.obterEstacao(id).subscribe({
    next: (response) => {
      if (response.success) {
        const estacao = response.data;
        console.log('Estação:', estacao.nome);
        console.log('Recursos:', estacao.recursos); // Array
      }
    },
    error: (error) => {
      console.error('Erro ao obter estação:', error);
    }
  });
}
```

### Verificar disponibilidade
```typescript
export class AgendamentoComponent implements OnInit {
  horarios_disponiveis: any[] = [];
  horarios_ocupados: any[] = [];

  constructor(private estacaoService: EstacaoService) {}

  verificarDisponibilidade(estacao_id: number, data: string): void {
    // Data deve estar em YYYY-MM-DD (o serviço converte automaticamente)
    this.estacaoService.verificarDisponibilidade(estacao_id, data).subscribe({
      next: (response) => {
        if (response.success) {
          const disponibilidade = response.data;
          console.log('Horários ocupados:', disponibilidade.horarios_ocupados);
          console.log('Horários disponíveis:', disponibilidade.horarios_disponiveis);
          
          this.horarios_ocupados = disponibilidade.horarios_ocupados;
          this.horarios_disponiveis = disponibilidade.horarios_disponiveis;
        }
      },
      error: (error) => {
        console.error('Erro ao verificar disponibilidade:', error);
      }
    });
  }
}
```

---

## ReservasService

### Criar reserva
```typescript
export class AgendamentoComponent {
  estacao_id = 1;
  data = '15/12/2024'; // DD/MM/YYYY (frontend)
  horario_inicio = '14:00';
  horario_fim = '15:30';
  observacoes = 'Com referência de tatuagem';

  constructor(private reservasService: ReservasService) {}

  criar(): void {
    this.reservasService.adicionarReserva(
      this.estacao_id,
      this.data, // DD/MM/YYYY - o serviço converte para YYYY-MM-DD
      this.horario_inicio,
      this.horario_fim,
      this.observacoes
    ).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Reserva criada:', response.data);
          // Lista de reservas atualiza automaticamente!
          this.router.navigate(['/minhas-reservas']);
        }
      },
      error: (error) => {
        if (error.status === 409) {
          alert('Horário conflita com outro agendamento');
        } else {
          alert(error.error?.message || 'Erro ao criar reserva');
        }
      }
    });
  }
}
```

### Verificar conflito ANTES de criar
```typescript
export class AgendamentoComponent {
  temConflito = false;

  constructor(private reservasService: ReservasService) {}

  verificarConflito(): void {
    this.reservasService.temConflito(
      this.estacao_id,
      this.data,
      this.horario_inicio,
      this.horario_fim
    ).subscribe({
      next: (conflito) => {
        this.temConflito = conflito;
        if (conflito) {
          alert('Este horário não está disponível');
        }
      }
    });
  }
}
```

### Template de verificação
```html
<form (ngSubmit)="criar()">
  <input type="date" [(ngModel)]="data" />
  <input type="time" [(ngModel)]="horario_inicio" (change)="verificarConflito()" />
  <input type="time" [(ngModel)]="horario_fim" (change)="verificarConflito()" />
  
  <div *ngIf="temConflito" class="aviso-conflito">
    ⚠️ Este horário não está disponível
  </div>
  
  <button [disabled]="temConflito" type="submit">
    Agendar
  </button>
</form>
```

### Listar minhas reservas
```typescript
export class MinhasReservasComponent implements OnInit {
  reservas: Reserva[] = [];
  carregando = true;

  constructor(private reservasService: ReservasService) {}

  ngOnInit(): void {
    // Método 1: Via Observable
    this.reservasService.reservas$.subscribe((reservas) => {
      this.reservas = reservas;
      this.carregando = false;
    });

    // Isto carrega as reservas do backend
    this.reservasService.carregarReservas();
  }

  // Método alternativo 2: Direto do serviço
  // this.reservas = this.reservasService.getReservas();
}
```

### Template de reservas
```html
<div *ngIf="carregando">
  Carregando suas reservas...
</div>

<div *ngIf="!carregando && reservas.length === 0">
  Você não tem reservas ainda.
  <a routerLink="/catalogo">Fazer uma reserva</a>
</div>

<table *ngIf="!carregando && reservas.length > 0">
  <thead>
    <tr>
      <th>Estação</th>
      <th>Data</th>
      <th>Horário</th>
      <th>Valor</th>
      <th>Status</th>
      <th>Ações</th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let reserva of reservas">
      <td>{{ reserva.estacao }}</td>
      <td>{{ reserva.data }}</td>
      <td>{{ reserva.periodo }}</td>
      <td>{{ reserva.valor }}</td>
      <td [class]="'status-' + reserva.classeStatus">
        {{ reserva.status | uppercase }}
      </td>
      <td>
        <button 
          *ngIf="reserva.status !== 'cancelada'"
          (click)="cancelar(reserva.id)"
          class="btn-cancelar">
          Cancelar
        </button>
      </td>
    </tr>
  </tbody>
</table>
```

### Cancelar reserva
```typescript
cancelar(id: number): void {
  if (!confirm('Tem certeza que deseja cancelar?')) {
    return;
  }

  this.reservasService.cancelarReserva(id).subscribe({
    next: (response) => {
      console.log('Reserva cancelada');
      // A lista se atualiza automaticamente via Observable!
    },
    error: (error) => {
      alert(error.error?.message || 'Erro ao cancelar reserva');
    }
  });
}
```

### Obter reserva específica
```typescript
obterDetalhes(id: number): void {
  this.reservasService.obterReserva(id).subscribe({
    next: (response) => {
      if (response.success) {
        const reserva = response.data;
        console.log('Reserva:', reserva);
      }
    },
    error: (error) => {
      console.error('Erro:', error);
    }
  });
}
```

---

## Tratamento de Erros

### Erros comuns

#### 1. 401 - Unauthorized
```typescript
error: (error: HttpErrorResponse) => {
  if (error.status === 401) {
    // Token inválido ou expirado
    // O interceptor já faz logout automaticamente!
    console.error('Sessão expirada. Faça login novamente.');
  }
}
```

#### 2. 409 - Conflict (Reserva)
```typescript
error: (error: HttpErrorResponse) => {
  if (error.status === 409) {
    // Horário conflita
    alert('Este horário já está agendado. Escolha outro.');
  }
}
```

#### 3. 400 - Bad Request (Validação)
```typescript
error: (error: HttpErrorResponse) => {
  if (error.status === 400) {
    // Erro de validação
    const mensagens = error.error.errors;
    console.error('Erros de validação:', mensagens);
    // mensagens pode ser:
    // { email: 'E-mail já existe', senha: 'Muito fraca' }
  }
}
```

#### 4. 500 - Server Error
```typescript
error: (error: HttpErrorResponse) => {
  if (error.status === 500) {
    alert('Erro no servidor. Tente novamente mais tarde.');
  }
}
```

### Tratamento genérico
```typescript
private handleError(error: HttpErrorResponse): Observable<never> {
  let mensagem = 'Erro desconhecido';

  if (error.status === 0) {
    mensagem = 'Não consegui conectar ao servidor. Verifique sua conexão.';
  } else if (error.status === 400) {
    mensagem = error.error?.message || 'Dados inválidos';
  } else if (error.status === 401) {
    mensagem = 'Sessão expirada. Faça login novamente.';
  } else if (error.status === 409) {
    mensagem = error.error?.message || 'Conflito: horário não disponível';
  } else if (error.status >= 500) {
    mensagem = 'Erro no servidor. Tente novamente.';
  }

  console.error('Erro HTTP:', error.status, mensagem);
  return throwError(() => ({ status: error.status, message: mensagem }));
}
```

---

## 📋 Padrão de Resposta do Backend

Todas as respostas seguem este formato:

```json
{
  "success": true,
  "status": 200,
  "message": "Operação realizada com sucesso",
  "data": { /* dados */ },
  "errors": {}
}
```

### Exemplo - Login bem-sucedido
```json
{
  "success": true,
  "status": 200,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "email": "artista@example.com",
      "nome_artistico": "Tatuador XYZ"
    },
    "token": "abc123xyz..."
  },
  "errors": {}
}
```

### Exemplo - Erro de validação
```json
{
  "success": false,
  "status": 400,
  "message": "Erro de validação",
  "data": {},
  "errors": {
    "email": "E-mail inválido",
    "senha": "Senha muito fraca"
  }
}
```

---

## 💡 Dicas Importantes

1. **Sempre use Observable.subscribe()**
   ```typescript
   // ✅ Correto
   this.authService.entrar(...).subscribe({ next: ... });

   // ❌ Errado (não faz nada)
   this.authService.entrar(...);
   ```

2. **Use AsyncPipe em templates** para evitar memory leaks
   ```html
   <!-- ✅ Correto -->
   <div *ngIf="authService.usuario$ | async as usuario">
     {{ usuario.nome }}
   </div>

   <!-- ❌ Errado (pode vazar memória) -->
   <div *ngIf="usuario">
     {{ usuario.nome }}
   </div>
   ```

3. **Data deve estar em DD/MM/YYYY no frontend**
   ```typescript
   // ✅ Correto
   this.reservasService.adicionarReserva(1, '15/12/2024', ...);

   // ❌ Errado
   this.reservasService.adicionarReserva(1, '2024-12-15', ...);
   // O serviço converte automaticamente!
   ```

4. **Token é gerenciado automaticamente**
   ```typescript
   // Não precisa fazer nada, o interceptor adiciona automaticamente
   // Basta chamar os serviços normalmente
   ```

---

**Pronto para usar! 🚀**
