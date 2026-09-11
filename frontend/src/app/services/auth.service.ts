import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_URL } from './api.config';

export interface Usuario {
  id?: number;
  nome: string;
  nome_artistico?: string;
  email: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  status: number;
  message: string;
  data: T;
  errors?: unknown;
}

export interface LoginData {
  token: string;
  user: Usuario;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = API_URL;
  private readonly tokenKey = 'inkstation-token';
  private readonly usuarioKey = 'inkstation-usuario';
  private readonly usuarioSubject = new BehaviorSubject<Usuario | null>(this.usuarioSalvo());
  readonly usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {}

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get usuario(): Usuario | null {
    return this.usuarioSubject.value;
  }

  get estaAutenticado(): boolean {
    return Boolean(this.token && this.usuario);
  }

  entrar(emailOuNome: string, senha: string): Observable<ApiResponse<LoginData>> {
    return this.http.post<ApiResponse<LoginData>>(`${this.apiUrl}/auth/login`, { email: emailOuNome, senha }).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.data.token);
        localStorage.setItem(this.usuarioKey, JSON.stringify(response.data.user));
        this.usuarioSubject.next(response.data.user);
      }),
    );
  }

  entrarComGoogle(credential: string): Observable<ApiResponse<LoginData>> {
    return this.http.post<ApiResponse<LoginData>>(`${this.apiUrl}/auth/google`, { credential }).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.data.token);
        localStorage.setItem(this.usuarioKey, JSON.stringify(response.data.user));
        this.usuarioSubject.next(response.data.user);
      }),
    );
  }

  cadastrar(nome_artistico: string, email: string, senha: string, confirmar_senha: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/auth/register`, {
      nome_artistico,
      email,
      senha,
      confirmar_senha,
    });
  }

  solicitarRecuperacao(email: string): Observable<ApiResponse<{ token: string }>> {
    return this.http.post<ApiResponse<{ token: string }>>(`${this.apiUrl}/auth/esqueci-senha`, { email });
  }

  redefinirSenha(email: string, token: string, nova_senha: string, confirmar_senha: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/auth/redefinir-senha`, {
      email,
      token,
      nova_senha,
      confirmar_senha,
    });
  }

  sair(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
    this.usuarioSubject.next(null);
  }

  private usuarioSalvo(): Usuario | null {
    try {
      const usuario = localStorage.getItem(this.usuarioKey);
      return usuario ? (JSON.parse(usuario) as Usuario) : null;
    } catch {
      return null;
    }
  }
}