import { Injectable } from '@angular/core';

export interface UsuarioSessao {
  email: string;
  nome: string;
}

interface Conta {
  email: string;
  nome: string;
  senha: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private static readonly STORAGE_KEY = 'inkstation-sessao';
  private static readonly CONTAS_KEY = 'inkstation-contas';

  get usuario(): UsuarioSessao | null {
    try {
      const dados = localStorage.getItem(AuthService.STORAGE_KEY)
        ?? sessionStorage.getItem(AuthService.STORAGE_KEY);
      return dados ? (JSON.parse(dados) as UsuarioSessao) : null;
    } catch {
      return null;
    }
  }

  get estaAutenticado(): boolean {
    return this.usuario !== null;
  }

  entrar(email: string, senha: string, lembrar: boolean): boolean {
    const emailNormalizado = email.trim().toLowerCase();
    const conta = this.contas.find((item) => item.email === emailNormalizado && item.senha === senha);

    if (!conta) {
      return false;
    }

    const sessao: UsuarioSessao = {
      email: emailNormalizado,
      nome: conta.nome,
    };

    this.sair();

    if (lembrar) {
      localStorage.setItem(AuthService.STORAGE_KEY, JSON.stringify(sessao));
    } else {
      sessionStorage.setItem(AuthService.STORAGE_KEY, JSON.stringify(sessao));
    }

    return true;
  }

  cadastrar(nome: string, email: string, senha: string): boolean {
    const emailNormalizado = email.trim().toLowerCase();

    if (this.contas.some((conta) => conta.email === emailNormalizado)) {
      return false;
    }

    const contas = [...this.contas, { email: emailNormalizado, nome: nome.trim(), senha }];
    localStorage.setItem(AuthService.CONTAS_KEY, JSON.stringify(contas));
    return true;
  }

  entrarComGoogle(lembrar: boolean): void {
    const sessao: UsuarioSessao = {
      email: 'artista.google@inkstation.com',
      nome: 'Artista Google',
    };

    this.sair();
    const armazenamento = lembrar ? localStorage : sessionStorage;
    armazenamento.setItem(AuthService.STORAGE_KEY, JSON.stringify(sessao));
  }

  private get contas(): Conta[] {
    try {
      const dados = localStorage.getItem(AuthService.CONTAS_KEY);

      if (!dados) {
        return [{ email: 'tatuador@inkstation.com', nome: 'Tatuador InkStation', senha: '123456' }];
      }

      const contas = JSON.parse(dados) as Conta[];
      return Array.isArray(contas) ? contas : [];
    } catch {
      return [];
    }
  }

  sair(): void {
    localStorage.removeItem(AuthService.STORAGE_KEY);
    sessionStorage.removeItem(AuthService.STORAGE_KEY);
  }
}
