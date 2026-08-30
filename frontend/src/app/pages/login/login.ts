import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GOOGLE_CLIENT_ID } from '../../services/google-auth.config';

declare const google: any;

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements AfterViewInit {
  @ViewChild('googleButton') googleButton?: ElementRef<HTMLDivElement>;

  modo: 'login' | 'cadastro' = 'login';
  nome = '';
  email = 'artista@example.com';
  senha = 'senha123456';
  confirmarSenha = '';
  lembrar = true;
  erro = '';
  sucesso = '';
  carregando = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngAfterViewInit(): void {
    this.inicializarGoogle();
  }

  private inicializarGoogle(): void {
    if (typeof google === 'undefined' || !this.googleButton || GOOGLE_CLIENT_ID.startsWith('SUBSTITUA')) {
      return;
    }

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => this.aoReceberCredencialGoogle(response.credential),
    });
    google.accounts.id.renderButton(this.googleButton.nativeElement, {
      theme: 'filled_black',
      size: 'large',
      width: 320,
      text: 'continue_with',
    });
  }

  private aoReceberCredencialGoogle(credential: string): void {
    this.erro = '';
    this.sucesso = '';
    this.carregando = true;

    this.authService.entrarComGoogle(credential).subscribe({
      next: () => {
        this.sucesso = 'Login com Google realizado com sucesso!';
        this.carregando = false;
        setTimeout(() => this.irParaDestino(), 800);
      },
      error: (error) => {
        this.carregando = false;
        this.erro = error.error?.message ?? 'Não foi possível entrar com o Google.';
      },
    });
  }

  entrar(): void {
    this.erro = '';
    this.sucesso = '';
    this.carregando = true;

    if (this.modo === 'cadastro') {
      this.criarCadastro();
      return;
    }

    this.authService.entrar(this.email, this.senha).subscribe({
      next: () => {
        this.sucesso = 'Login realizado com sucesso!';
        this.carregando = false;
        setTimeout(() => this.irParaDestino(), 1000);
      },
      error: (error) => {
        this.carregando = false;
        const mensagem = error.error?.message ?? 'E-mail ou senha inválidos.';
        this.erro = mensagem;
        console.error('Erro de login:', error);
      },
    });
  }

  entrarComGoogle(): void {
    this.erro = '';

    if (GOOGLE_CLIENT_ID.startsWith('SUBSTITUA')) {
      this.erro = 'Login com Google ainda não foi configurado (falta o Client ID).';
      return;
    }

    if (typeof google !== 'undefined') {
      google.accounts.id.prompt();
    }
  }

  alternarModo(): void {
    this.modo = this.modo === 'login' ? 'cadastro' : 'login';
    this.erro = '';
    this.sucesso = '';
    this.nome = '';
    this.confirmarSenha = '';
    if (this.modo === 'login') {
      this.email = 'artista@example.com';
      this.senha = 'senha123456';
    } else {
      this.email = '';
      this.senha = '';
    }
  }

  resetarSenha(): void {
    this.modo = 'cadastro';
    this.erro = '';
    this.sucesso = 'Para criar uma nova senha, use o modo de cadastro com um novo e-mail ou entre em contato com suporte.';
    this.nome = '';
    this.confirmarSenha = '';
    this.senha = '';
  }

  private criarCadastro(): void {
    if (!this.nome.trim() || !this.email.trim() || this.senha.length < 8) {
      this.erro = 'Preencha nome, e-mail e uma senha com pelo menos 8 caracteres.';
      this.carregando = false;
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      this.erro = 'As senhas não coincidem.';
      this.carregando = false;
      return;
    }

    this.authService.cadastrar(this.nome, this.email, this.senha, this.confirmarSenha).subscribe({
      next: (response) => {
        this.sucesso = 'Cadastro realizado com sucesso! Entrando na conta...';
        setTimeout(() => {
          this.authService.entrar(this.email, this.senha).subscribe({
            next: () => this.irParaDestino(),
            error: () => {
              this.carregando = false;
              this.erro = 'Cadastro realizado, mas não foi possível iniciar a sessão.';
            },
          });
        }, 1000);
      },
      error: (error) => {
        this.carregando = false;
        if (error.status === 409) {
          this.erro = 'Este e-mail já possui cadastro. Volte para o login e entre com sua senha.';
        } else {
          this.erro = error.error?.message ?? 'Erro ao realizar cadastro. Tente novamente.';
        }
        console.error('Erro de cadastro:', error);
      },
    });
  }

  private irParaDestino(): void {
    const destino = this.route.snapshot.queryParamMap.get('redirect') ?? '/catalogo';
    this.router.navigateByUrl(destino.startsWith('/') ? destino : '/catalogo');
  }
}
