import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface Usuario {
  id?: number;
  nome: string;
  nome_artistico?: string;
  email: string;
}

interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
}

interface LoginData {
  token: string;
  user: Usuario;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api';
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

  entrar(email: string, senha: string): Observable<ApiResponse<LoginData>> {
    return this.http.post<ApiResponse<LoginData>>(`${this.apiUrl}/auth/login`, { email, senha }).pipe(
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

  sair(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
    this.usuarioSubject.next(null);
  }

  private usuarioSalvo(): Usuario | null {
    try {
      const usuario = localStorage.getItem(this.usuarioKey);
      return usuario ? JSON.parse(usuario) as Usuario : null;
    } catch {
      return null;
    }
  }
}
