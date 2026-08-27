import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface UsuarioSessao {
  id: number;
  email: string;
  nome_artistico?: string;
  nome?: string;
  created_at?: string;
}

interface LoginResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    user: UsuarioSessao;
    token: string;
  };
}

interface CadastroResponse {
  success: boolean;
  status: number;
  message: string;
  data: UsuarioSessao;
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
  private apiUrl = 'http://localhost:3000/api';
  private readonly STORAGE_KEY = 'inkstation-token';
  private readonly USUARIO_KEY = 'inkstation-usuario';
  private usuarioSubject = new BehaviorSubject<UsuarioSessao | null>(this.usuarioSalvo);

  public usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {
    this.verificarAutenticacao();
  }

  // ==================== GETTERS ====================

  get usuario(): UsuarioSessao | null {
    return this.usuarioSubject.value;
  }

  get estaAutenticado(): boolean {
    return this.usuario !== null && this.tokenValido;
  }

  get token(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  get tokenValido(): boolean {
    return this.token !== null && this.token.length > 0;
  }

  // ==================== PRIVATE METHODS ====================

  private get usuarioSalvo(): UsuarioSessao | null {
    try {
      const dados = localStorage.getItem(this.USUARIO_KEY);
      return dados ? JSON.parse(dados) : null;
    } catch {
      return null;
    }
  }

  private verificarAutenticacao(): void {
    const usuario = this.usuarioSalvo;
    if (usuario && this.token) {
      this.usuarioSubject.next(usuario);
    }
  }

  private salvarToken(token: string): void {
    localStorage.setItem(this.STORAGE_KEY, token);
  }

  private salvarUsuario(usuario: UsuarioSessao): void {
    localStorage.setItem(this.USUARIO_KEY, JSON.stringify(usuario));
  }

  private limparDados(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USUARIO_KEY);
  }

  private getHeaders(): HttpHeaders {
    const token = this.token;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      return headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Fazer login com e-mail e senha
   */
  entrar(email: string, senha: string, lembrar: boolean): Observable<LoginResponse> {
    return new Observable((observer) => {
      this.http
        .post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, senha })
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              // Salvar token
              this.salvarToken(response.data.token);

              // Salvar usuário
              this.salvarUsuario(response.data.user);

              // Atualizar subject
              this.usuarioSubject.next(response.data.user);

              observer.next(response);
              observer.complete();
            } else {
              observer.error(new Error(response.message || 'Login falhou'));
            }
          },
          error: (error) => {
            const mensagem = error.error?.message || 'Erro ao fazer login';
            observer.error({ error: { message: mensagem } });
          }
        });
    });
  }

  /**
   * Fazer cadastro de novo usuário
   */
  cadastrar(
    nome_artistico: string,
    email: string,
    senha: string,
    confirmar_senha: string
  ): Observable<CadastroResponse> {
    return new Observable((observer) => {
      const request: CadastroRequest = {
        nome_artistico,
        email,
        senha,
        confirmar_senha
      };

      this.http.post<CadastroResponse>(`${this.apiUrl}/auth/register`, request).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            observer.next(response);
            observer.complete();
          } else {
            observer.error(new Error(response.message || 'Cadastro falhou'));
          }
        },
        error: (error) => {
          const mensagem = error.error?.message || 'Erro ao fazer cadastro';
          observer.error({ error: { message: mensagem } });
        }
      });
    });
  }

  /**
   * Fazer logout
   */
  sair(): Observable<any> {
    return new Observable((observer) => {
      this.http.post<any>(`${this.apiUrl}/auth/logout`, {}, { headers: this.getHeaders() })
        .subscribe({
          next: (response) => {
            this.limparDados();
            this.usuarioSubject.next(null);
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            // Limpar mesmo com erro
            this.limparDados();
            this.usuarioSubject.next(null);
            observer.error(error);
          }
        });
    });
  }

  /**
   * Obter usuário atual do backend
   */
  obterUsuarioAtual(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/me`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Google OAuth (será implementado)
   */
  entrarComGoogle(token: string): Observable<LoginResponse> {
    return new Observable((observer) => {
      this.http
        .post<LoginResponse>(`${this.apiUrl}/auth/google`, { google_token: token })
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.salvarToken(response.data.token);
              this.salvarUsuario(response.data.user);
              this.usuarioSubject.next(response.data.user);
              observer.next(response);
              observer.complete();
            } else {
              observer.error(new Error('Google login falhou'));
            }
          },
          error: (error) => {
            observer.error(error);
          }
        });
    });
  }
}
