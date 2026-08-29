# Guia de Integração: Frontend Angular + Backend PHP

## 📋 Resumo da Integração

Seu frontend Angular está pronto com:
- ✅ AuthService com login/cadastro locais
- ✅ ReservasService com gerenciamento local
- ✅ Validação de conflito local
- ✅ Interface completa e responsiva

Meu backend PHP fornece:
- ✅ API REST com 13 endpoints
- ✅ Autenticação com tokens Bearer
- ✅ Banco de dados MySQL
- ✅ Validação rigorosa
- ✅ Segurança (bcrypt, CORS, SQL Injection prevention)

**Tarefa:** Conectar o frontend ao backend

---

## 🔗 Fluxo de Integração

### ANTES (Frontend local)
```
Angular App
  ├─ AuthService (localStorage)
  ├─ ReservasService (localStorage)
  └─ Validação local
```

### DEPOIS (Com backend)
```
Angular App
  └─ HttpClient / fetch()
       │
       ├─ AuthService → Backend API
       ├─ ReservasService → Backend API
       └─ EstacaoService → Backend API
             │
             ▼
         Backend PHP
             │
             ▼
         MySQL Database
```

---

## 🚀 PASSO 1: Preparar o Backend

O backend já está criado em:
```
C:\xampp\htdocs\inkstation\
```

### 1.1 - Iniciar XAMPP
```
Apache ✅ MySQL ✅
```

### 1.2 - Criar Banco de Dados
1. Abra http://localhost/phpmyadmin
2. Crie banco: `inkstation`
3. Execute `database/schema.sql`

### 1.3 - Verificar API
```bash
curl http://localhost/inkstation/public/api/estacoes
```

Deve retornar JSON com estações ✅

---

## 🔄 PASSO 2: Modificar o AuthService (Angular)

Seu AuthService atual usa localStorage. Vamos modificar para usar o backend:

### Antes:
```typescript
// src/app/services/auth.service.ts (ATUAL)
export class AuthService {
  entrar(email: string, senha: string, lembrar: boolean): boolean {
    const conta = this.contas.find((item) => item.email === email && item.senha === senha);
    if (!conta) return false;
    localStorage.setItem('token', JSON.stringify(sessao));
    return true;
  }
}
```

### Depois:
```typescript
// src/app/services/auth.service.ts (MODIFICADO)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface UsuarioSessao {
  id: number;
  email: string;
  nome: string;
  nome_artistico?: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    user: UsuarioSessao;
    token: string;
  };
}

interface CadastroRequest {
  nome_artistico: string;
  email: string;
  senha: string;
  confirmar_senha: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost/inkstation/public/api';
  private readonly STORAGE_KEY = 'inkstation-token';
  private usuarioSubject = new BehaviorSubject<UsuarioSessao | null>(this.usuarioSalvo);

  public usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {
    this.verificarAutenticacao();
  }

  // Obter usuário do localStorage
  get usuario(): UsuarioSessao | null {
    return this.usuarioSubject.value;
  }

  get estaAutenticado(): boolean {
    return this.usuario !== null && this.tokenValido;
  }

  // Obter token salvo
  get token(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  // Verificar se tem token
  get tokenValido(): boolean {
    return this.token !== null;
  }

  // Carregar usuário do localStorage
  private get usuarioSalvo(): UsuarioSessao | null {
    try {
      const dados = localStorage.getItem('inkstation-usuario');
      return dados ? JSON.parse(dados) : null;
    } catch {
      return null;
    }
  }

  // Verificar autenticação ao iniciar
  private verificarAutenticacao(): void {
    const usuario = this.usuarioSalvo;
    if (usuario && this.token) {
      this.usuarioSubject.next(usuario);
    }
  }

  // LOGIN com backend
  entrar(email: string, senha: string, lembrar: boolean): Observable<LoginResponse> {
    return new Observable((observer) => {
      this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, senha })
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              // Salvar token
              localStorage.setItem(this.STORAGE_KEY, response.data.token);
              
              // Salvar usuário
              localStorage.setItem('inkstation-usuario', JSON.stringify(response.data.user));
              
              // Atualizar subject
              this.usuarioSubject.next(response.data.user);
              
              observer.next(response);
              observer.complete();
            } else {
              observer.error(new Error('Login failed'));
            }
          },
          error: (error) => {
            observer.error(error);
          }
        });
    });
  }

  // CADASTRO com backend
  cadastrar(nome_artistico: string, email: string, senha: string, confirmar_senha: string): Observable<any> {
    return new Observable((observer) => {
      const request: CadastroRequest = {
        nome_artistico,
        email,
        senha,
        confirmar_senha
      };

      this.http.post<any>(`${this.apiUrl}/auth/register`, request)
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              observer.next(response);
              observer.complete();
            } else {
              observer.error(new Error('Registration failed'));
            }
          },
          error: (error) => {
            observer.error(error);
          }
        });
    });
  }

  // LOGOUT com backend
  sair(): Observable<any> {
    return new Observable((observer) => {
      this.http.post<any>(`${this.apiUrl}/auth/logout`, {})
        .subscribe({
          next: (response) => {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem('inkstation-usuario');
            this.usuarioSubject.next(null);
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            // Limpar mesmo com erro
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem('inkstation-usuario');
            this.usuarioSubject.next(null);
            observer.error(error);
          }
        });
    });
  }

  // Obter usuário atual do backend
  obterUsuarioAtual(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/me`);
  }

  // Google OAuth (será implementado)
  entrarComGoogle(lembrar: boolean): Observable<LoginResponse> {
    // TODO: Integrar com Google OAuth real
    // Por enquanto, retorna erro
    return new Observable((observer) => {
      observer.error(new Error('Google OAuth não implementado ainda'));
    });
  }
}
```

---

## 🔄 PASSO 3: Modificar o ReservasService (Angular)

### Criar novo arquivo: `src/app/services/estacoes.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Estacao {
  id: number;
  nome: string;
  categoria: string;
  descricao: string;
  preco_por_hora: number;
  imagem_url: string;
  recursos: string[];
  ativa: boolean;
}

export interface Disponibilidade {
  data: string;
  estacao_id: number;
  horarios_ocupados: Array<{ horario_inicio: string; horario_fim: string }>;
  horarios_disponiveis: Array<{ inicio: string; fim: string }>;
}

@Injectable({
  providedIn: 'root',
})
export class EstacaoService {
  private apiUrl = 'http://localhost/inkstation/public/api';

  constructor(private http: HttpClient) {}

  // Listar todas as estações
  listarEstacoes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estacoes`);
  }

  // Obter detalhes de uma estação
  obterEstacao(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estacoes/${id}`);
  }

  // Verificar disponibilidade
  verificarDisponibilidade(id: number, data: string): Observable<Disponibilidade> {
    return this.http.get<Disponibilidade>(
      `${this.apiUrl}/estacoes/${id}/disponibilidade?data=${data}`
    );
  }
}
```

### Modificar: `src/app/services/reservas.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

export type ReservaStatus = 'confirmada' | 'concluida' | 'pendente' | 'cancelada';
export type ReservaClasseStatus = 'confirmed' | 'completed' | 'pending' | 'canceled';

export interface Reserva {
  id: number;
  usuario_id?: number;
  estacao_id: number;
  estacao?: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  periodo?: string;
  duracao: number;
  valor_total: number;
  valor?: string;
  observacoes?: string;
  status: ReservaStatus;
  classeStatus?: ReservaClasseStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CriarReservaRequest {
  estacao_id: number;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  observacoes?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReservasService {
  private apiUrl = 'http://localhost/inkstation/public/api';
  private reservasSubject = new BehaviorSubject<Reserva[]>([]);
  public reservas$ = this.reservasSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.carregarReservas();
  }

  // Headers com token
  private getHeaders(): HttpHeaders {
    const token = this.authService.token;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  // Carregar reservas do backend
  carregarReservas(): void {
    if (!this.authService.estaAutenticado) {
      this.reservasSubject.next([]);
      return;
    }

    this.http.get<any>(`${this.apiUrl}/reservas`, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          if (response.success && Array.isArray(response.data)) {
            const reservas = response.data.map(this.converterReservaBackend);
            this.reservasSubject.next(reservas);
          }
        },
        error: (error) => {
          console.error('Erro ao carregar reservas:', error);
          this.reservasSubject.next([]);
        }
      });
  }

  // Converter formato do backend para frontend
  private converterReservaBackend(reserva: any): Reserva {
    const statusMap: { [key: string]: ReservaClasseStatus } = {
      confirmada: 'confirmed',
      concluida: 'completed',
      pendente: 'pending',
      cancelada: 'canceled'
    };

    const statusNome: { [key: string]: ReservaStatus } = {
      confirmada: 'confirmada',
      concluida: 'concluida',
      pendente: 'pendente',
      cancelada: 'cancelada'
    };

    return {
      id: reserva.id,
      usuario_id: reserva.usuario_id,
      estacao_id: reserva.estacao_id,
      estacao: reserva.estacao_nome || 'Estação',
      data: this.converterDataBackendParaUI(reserva.data),
      horario_inicio: reserva.horario_inicio,
      horario_fim: reserva.horario_fim,
      periodo: `${reserva.horario_inicio} - ${reserva.horario_fim}`,
      duracao: reserva.duracao,
      valor_total: reserva.valor_total,
      valor: `R$ ${parseFloat(reserva.valor_total).toFixed(2).replace('.', ',')}`,
      observacoes: reserva.observacoes,
      status: reserva.status as ReservaStatus,
      classeStatus: statusMap[reserva.status] || 'pending',
      created_at: reserva.created_at,
      updated_at: reserva.updated_at
    };
  }

  // Converter data do backend (YYYY-MM-DD) para UI (DD/MM/YYYY)
  private converterDataBackendParaUI(data: string): string {
    const [year, month, day] = data.split('-');
    return `${day}/${month}/${year}`;
  }

  // Converter data da UI (DD/MM/YYYY) para backend (YYYY-MM-DD)
  private converterDataUIParaBackend(data: string): string {
    const [day, month, year] = data.split('/');
    return `${year}-${month}-${day}`;
  }

  // Obter lista de reservas
  getReservas(): Reserva[] {
    return this.reservasSubject.value;
  }

  // Adicionar/Criar reserva
  adicionarReserva(estacao_id: number, data: string, horario_inicio: string, horario_fim: string, observacoes = ''): Observable<any> {
    const dataBackend = this.converterDataUIParaBackend(data);

    const request: CriarReservaRequest = {
      estacao_id,
      data: dataBackend,
      horario_inicio,
      horario_fim,
      observacoes
    };

    return new Observable((observer) => {
      this.http.post<any>(`${this.apiUrl}/reservas`, request, { headers: this.getHeaders() })
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const novaReserva = this.converterReservaBackend(response.data);
              const reservasAtuais = this.reservasSubject.value;
              this.reservasSubject.next([novaReserva, ...reservasAtuais]);
              observer.next(response);
              observer.complete();
            } else {
              observer.error(new Error('Falha ao criar reserva'));
            }
          },
          error: (error) => {
            observer.error(error);
          }
        });
    });
  }

  // Verificar conflito (usando backend)
  temConflito(estacao_id: number, data: string, horario_inicio: string, horario_fim: string): Observable<boolean> {
    const dataBackend = this.converterDataUIParaBackend(data);

    return new Observable((observer) => {
      this.http.get<any>(
        `${this.apiUrl}/estacoes/${estacao_id}/disponibilidade?data=${dataBackend}`
      )
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const disponibilidade = response.data;
              const novoInicio = this.converterHora(horario_inicio);
              const novoFim = this.converterHora(horario_fim);

              const temConflito = disponibilidade.horarios_ocupados.some((ocupado: any) => {
                const existeInicio = this.converterHora(ocupado.horario_inicio);
                const existeFim = this.converterHora(ocupado.horario_fim);
                return novoInicio < existeFim && novoFim > existeInicio;
              });

              observer.next(temConflito);
              observer.complete();
            } else {
              observer.next(false);
              observer.complete();
            }
          },
          error: () => {
            observer.next(false);
            observer.complete();
          }
        });
    });
  }

  // Converter hora (HH:MM) para minutos
  private converterHora(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  // Cancelar reserva
  cancelarReserva(id: number): Observable<any> {
    return new Observable((observer) => {
      this.http.patch<any>(`${this.apiUrl}/reservas/${id}/cancelar`, {}, { headers: this.getHeaders() })
        .subscribe({
          next: (response) => {
            if (response.success) {
              // Atualizar lista local
              const reservas = this.reservasSubject.value.map((r) => {
                if (r.id === id) {
                  return {
                    ...r,
                    status: 'cancelada' as ReservaStatus,
                    classeStatus: 'canceled' as ReservaClasseStatus
                  };
                }
                return r;
              });
              this.reservasSubject.next(reservas);
              observer.next(response);
              observer.complete();
            } else {
              observer.error(new Error('Falha ao cancelar reserva'));
            }
          },
          error: (error) => {
            observer.error(error);
          }
        });
    });
  }

  // Obter uma reserva específica
  obterReserva(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reservas/${id}`, { headers: this.getHeaders() });
  }
}
```

---

## 🔄 PASSO 4: Configurar HttpClient (app.config.ts)

Adicione o HttpClientModule ao seu `app.config.ts`:

```typescript
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';

// Interceptor para adicionar token em todas as requisições
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.token;
    if (token) {
      const clonedReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(clonedReq);
    }
    return next.handle(req);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    importProvidersFrom(HttpClientModule),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
};
```

---

## 🔄 PASSO 5: Modificar Componentes

### LoginComponent
```typescript
// src/app/pages/login/login.component.ts
import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  senha = '';
  lembrarDeMim = false;
  erro = '';
  carregando = false;
  modoRegistro = false;
  nomeArtistico = '';
  confirmarSenha = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  entrar(): void {
    if (!this.email || !this.senha) {
      this.erro = 'E-mail e senha são obrigatórios';
      return;
    }

    this.carregando = true;
    this.erro = '';

    this.authService.entrar(this.email, this.senha, this.lembrarDeMim).subscribe({
      next: (response) => {
        this.carregando = false;
        this.router.navigate(['/catalogo']);
      },
      error: (error) => {
        this.carregando = false;
        this.erro = error.error?.message || 'Erro ao fazer login. Verifique suas credenciais.';
      }
    });
  }

  cadastrar(): void {
    if (!this.nomeArtistico || !this.email || !this.senha || !this.confirmarSenha) {
      this.erro = 'Todos os campos são obrigatórios';
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      this.erro = 'As senhas não conferem';
      return;
    }

    this.carregando = true;
    this.erro = '';

    this.authService.cadastrar(this.nomeArtistico, this.email, this.senha, this.confirmarSenha).subscribe({
      next: (response) => {
        this.carregando = false;
        this.erro = '';
        this.modoRegistro = false;
        // Fazer login automaticamente
        this.entrar();
      },
      error: (error) => {
        this.carregando = false;
        this.erro = error.error?.message || 'Erro ao fazer cadastro';
      }
    });
  }

  alternarModo(): void {
    this.modoRegistro = !this.modoRegistro;
    this.erro = '';
    this.email = '';
    this.senha = '';
    this.confirmarSenha = '';
    this.nomeArtistico = '';
  }
}
```

### CatalogoComponent
```typescript
// src/app/pages/catalogo/catalogo.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EstacaoService } from '../../services/estacoes.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.scss']
})
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

### AgendamentoComponent
```typescript
// src/app/pages/agendamento/agendamento.component.ts
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReservasService } from '../../services/reservas.service';
import { EstacaoService } from '../../services/estacoes.service';

@Component({
  selector: 'app-agendamento',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './agendamento.component.html',
  styleUrls: ['./agendamento.component.scss']
})
export class AgendamentoComponent implements OnInit {
  estacao_id: number | null = null;
  estacao: any = null;
  data = '';
  horario_inicio = '';
  horario_fim = '';
  observacoes = '';
  aceptouBiosseguranca = false;
  
  valor_total = 0;
  duracao = 0;
  
  carregando = false;
  erro = '';
  sucesso = '';
  temConflito = false;

  constructor(
    private reservasService: ReservasService,
    private estacaoService: EstacaoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['estacao_id']) {
        this.estacao_id = parseInt(params['estacao_id']);
        this.carregarEstacao();
      }
    });
  }

  carregarEstacao(): void {
    if (!this.estacao_id) return;

    this.estacaoService.obterEstacao(this.estacao_id).subscribe({
      next: (response) => {
        if (response.success) {
          this.estacao = response.data;
        }
      },
      error: (error) => {
        this.erro = 'Erro ao carregar estação';
      }
    });
  }

  calcularValor(): void {
    if (!this.estacao || !this.horario_inicio || !this.horario_fim) {
      this.valor_total = 0;
      this.duracao = 0;
      return;
    }

    const inicio = this.converterHora(this.horario_inicio);
    const fim = this.converterHora(this.horario_fim);

    if (fim <= inicio) {
      this.erro = 'Horário final deve ser maior que horário inicial';
      this.valor_total = 0;
      this.duracao = 0;
      return;
    }

    this.duracao = (fim - inicio) / 60;
    this.valor_total = this.duracao * this.estacao.preco_por_hora;
  }

  verificarConflito(): void {
    if (!this.estacao_id || !this.data || !this.horario_inicio || !this.horario_fim) {
      this.temConflito = false;
      return;
    }

    this.reservasService.temConflito(this.estacao_id, this.data, this.horario_inicio, this.horario_fim)
      .subscribe({
        next: (conflito) => {
          this.temConflito = conflito;
          if (conflito) {
            this.erro = 'Horário conflita com outra reserva';
          } else {
            this.erro = '';
          }
        }
      });
  }

  criar(): void {
    if (!this.estacao_id) {
      this.erro = 'Estação não selecionada';
      return;
    }

    if (!this.data) {
      this.erro = 'Data é obrigatória';
      return;
    }

    if (!this.horario_inicio || !this.horario_fim) {
      this.erro = 'Horários são obrigatórios';
      return;
    }

    if (!this.aceptouBiosseguranca) {
      this.erro = 'Você deve aceitar o termo de biossegurança';
      return;
    }

    if (this.temConflito) {
      this.erro = 'Horário conflita com outra reserva';
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
      next: (response) => {
        this.carregando = false;
        this.sucesso = 'Reserva criada com sucesso!';
        setTimeout(() => {
          this.router.navigate(['/minhas-reservas']);
        }, 2000);
      },
      error: (error) => {
        this.carregando = false;
        this.erro = error.error?.message || 'Erro ao criar reserva';
      }
    });
  }

  private converterHora(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }
}
```

### MinhasReservasComponent
```typescript
// src/app/pages/minhas-reservas/minhas-reservas.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReservasService, Reserva } from '../../services/reservas.service';

@Component({
  selector: 'app-minhas-reservas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './minhas-reservas.component.html',
  styleUrls: ['./minhas-reservas.component.scss']
})
export class MinhasReservasComponent implements OnInit {
  reservas: Reserva[] = [];
  carregando = true;
  erro = '';
  reservaEmCancelamento: number | null = null;

  constructor(private reservasService: ReservasService) {}

  ngOnInit(): void {
    this.carregarReservas();
  }

  carregarReservas(): void {
    this.reservasService.reservas$.subscribe((reservas) => {
      this.reservas = reservas;
      this.carregando = false;
    });

    // Recarregar do backend
    this.reservasService.carregarReservas();
  }

  cancelar(id: number): void {
    this.reservaEmCancelamento = id;
  }

  confirmarCancelamento(id: number): void {
    this.reservasService.cancelarReserva(id).subscribe({
      next: () => {
        this.reservaEmCancelamento = null;
      },
      error: (error) => {
        this.erro = error.error?.message || 'Erro ao cancelar reserva';
      }
    });
  }

  cancelarCancelamento(): void {
    this.reservaEmCancelamento = null;
  }
}
```

---

## 🛡️ PASSO 6: Configurar CORS (Já está feito no backend!)

O backend PHP já tem CORS configurado. Nenhuma mudança necessária!

```php
// public/index.php (já configurado)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
```

---

## 🚀 PASSO 7: Testes de Integração

### 1. Teste de Login
```bash
# Terminal 1: Backend rodando
http://localhost/inkstation/public/api/auth/login

# No navegador: Frontend
http://localhost:4200/login
→ Digite: artista@example.com / senha123456
→ Deve fazer login e ir para /catalogo
```

### 2. Teste de Catálogo
```
http://localhost:4200/catalogo
→ Deve carregar estações do backend
→ Clicar em estação → /agendamento
```

### 3. Teste de Agendamento
```
http://localhost:4200/agendamento?estacao_id=1
→ Deve carregar detalhes da estação
→ Preencher dados
→ Clicar "Agendar"
→ Deve criar reserva no backend
```

### 4. Teste de Minhas Reservas
```
http://localhost:4200/minhas-reservas
→ Deve carregar reservas do backend
→ Cancelar reserva → Deve deletar do backend
```

---

## 📊 Mapeamento de Dados

### Format de Data
**Frontend:** DD/MM/YYYY
**Backend:** YYYY-MM-DD

Conversão automática nos serviços ✅

### Format de Horário
**Frontend e Backend:** HH:MM (igual)

### Status da Reserva
| Frontend | Backend |
|----------|---------|
| Confirmada | confirmada |
| Concluída | concluida |
| Pendente | pendente |
| Cancelada | cancelada |

### Valor Total
**Frontend:** Calcula e exibe formatado
**Backend:** Recalcula e valida

---

## 🐛 Troubleshooting

### Erro: "CORS error"
**Solução:** Verifique se backend está rodando e acessível

```bash
curl http://localhost/inkstation/public/api/estacoes
```

### Erro: "401 Unauthorized"
**Solução:** Token expirou ou inválido. Faça login novamente

### Erro: "404 Not Found"
**Solução:** Verifique a URL da API

```typescript
// Deve ser:
private apiUrl = 'http://localhost/inkstation/public/api';

// Não:
private apiUrl = 'http://localhost:3000/api'; // ❌ ERRADO
```

### Erro: "POST /reservas - 409 Conflict"
**Solução:** Horário conflita. Escolha outro horário

---

## ✅ Checklist Final

- [ ] Backend rodando (Apache + MySQL)
- [ ] Banco de dados criado e preenchido
- [ ] API respondendo (http://localhost/inkstation/public/api/estacoes)
- [ ] AuthService modificado
- [ ] ReservasService modificado
- [ ] EstacaoService criado
- [ ] HttpClient configurado
- [ ] Componentes modificados
- [ ] ng serve funcionando
- [ ] Login funcionando
- [ ] Catálogo carregando
- [ ] Agendamento funcionando
- [ ] Minhas reservas funcionando
- [ ] Cancelamento funcionando

---

## 📝 Próximos Passos

1. **Google OAuth Real** (quando credenciais Google estiverem prontas)
2. **Integração com WebSockets** (notificações em tempo real)
3. **Upload de Imagens** (para perfil do usuário)
4. **Sistema de Avaliações** (para estações)
5. **Dashboard Admin** (gerenciar estações)

---

**Integração Completa Pronta! 🎉**

Seu frontend Angular agora está conectado ao backend PHP real!
