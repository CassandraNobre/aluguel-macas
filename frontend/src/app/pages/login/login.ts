import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  modo: 'login' | 'cadastro' = 'login';
  nome = '';
  email = 'tatuador@inkstation.com';
  senha = '123456';
  confirmarSenha = '';
  lembrar = true;
  erro = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  entrar(): void {
    this.erro = '';

    if (this.modo === 'cadastro') {
      this.criarCadastro();
      return;
    }

    this.authService.entrar(this.email, this.senha).subscribe({
      next: () => this.irParaDestino(),
      error: (error) => {
        this.erro = error.error?.message ?? 'E-mail ou senha inválidos.';
      },
    });
  }

  entrarComGoogle(): void {
    this.erro = '';
    this.erro = 'O login com Google será habilitado pelo backend.';
  }

  alternarModo(): void {
    this.modo = this.modo === 'login' ? 'cadastro' : 'login';
    this.erro = '';
    this.nome = '';
    this.confirmarSenha = '';
    this.email = '';
    this.senha = '';
  }

  private criarCadastro(): void {
    if (!this.nome.trim() || !this.email.trim() || this.senha.length < 6) {
      this.erro = 'Preencha nome, e-mail e uma senha com pelo menos 6 caracteres.';
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      this.erro = 'As senhas não coincidem.';
      return;
    }

    this.authService.cadastrar(this.nome, this.email, this.senha, this.confirmarSenha).subscribe({
      next: () => {
        this.authService.entrar(this.email, this.senha).subscribe({
          next: () => this.irParaDestino(),
          error: () => this.erro = 'Cadastro realizado, mas não foi possível iniciar a sessão.',
        });
      },
      error: (error) => {
        this.erro = error.error?.message ?? 'Erro ao realizar cadastro.';
      },
    });
  }

  private irParaDestino(): void {
    const destino = this.route.snapshot.queryParamMap.get('redirect') ?? '/catalogo';
    this.router.navigateByUrl(destino.startsWith('/') ? destino : '/catalogo');
  }
}
