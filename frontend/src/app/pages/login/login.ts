import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  modo: 'login' | 'cadastro' | 'recuperar' = 'login';

  nome = '';
  email = '';
  senha = '';
  confirmarSenha = '';
  lembrar = false;
  erro = '';
  sucesso = '';
  carregando = false;
  mostrarSenha = false;
  mostrarConfirmacao = false;

  alternarSenha(): void { this.mostrarSenha = !this.mostrarSenha; }
  alternarConfirmacao(): void { this.mostrarConfirmacao = !this.mostrarConfirmacao; }

  private readonly CHAVE_LEMBRAR = 'inkstation_remember_login';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const usuarioSalvo = localStorage.getItem(this.CHAVE_LEMBRAR);
    if (usuarioSalvo) {
      this.email = usuarioSalvo;
      this.lembrar = true;
    }
  }

  entrar(): void {
    this.erro = '';
    this.sucesso = '';

    if (this.modo === 'cadastro') {
      this.criarCadastro();
      return;
    }

    if (this.modo === 'recuperar') {
      this.confirmarNovaSenha();
      return;
    }

    // Validação na tela de Login
    if (!this.email.trim()) {
      this.erro = 'Informe o seu e-mail ou nome para entrar.';
      return;
    }

    if (!this.senha) {
      this.erro = 'Informe a sua senha.';
      return;
    }

    this.carregando = true;
    this.authService.entrar(this.email, this.senha).subscribe({
      next: () => {
        this.salvarPreferenciaLembrar();
        this.sucesso = 'Login realizado com sucesso!';
        this.carregando = false;
        setTimeout(() => this.irParaDestino(), 500);
      },
      error: (error) => {
        this.carregando = false;
        this.erro = error.error?.message ?? 'E-mail/Nome ou senha inválidos.';
      },
    });
  }

  confirmarNovaSenha(): void {
    if (!this.email.trim()) {
      this.erro = 'Informe o e-mail ou nome cadastrado.';
      return;
    }

    if (!this.senha) {
      this.erro = 'Informe a nova senha.';
      return;
    }

    if (!this.confirmarSenha) {
      this.erro = 'Confirme a nova senha.';
      return;
    }

    if (this.senha !== this.confirmarSenha) {
      this.erro = 'As senhas não coincidem.';
      return;
    }

    if (this.senha.length < 8) {
      this.erro = 'A nova senha deve ter pelo menos 8 caracteres.';
      return;
    }

    this.carregando = true;
    this.authService.redefinirSenha(this.email, this.senha, this.confirmarSenha).subscribe({
      next: (res) => {
        this.sucesso = 'Senha redefinida! Entrando no sistema...';

        // Entra automaticamente no sistema com a nova senha
        this.authService.entrar(this.email, this.senha).subscribe({
          next: () => {
            this.carregando = false;
            this.irParaDestino();
          },
          error: () => {
            this.carregando = false;
            this.modo = 'login';
            this.sucesso = res.message || 'Senha alterada com sucesso! Faça login com sua nova senha.';
          },
        });
      },
      error: (err) => {
        this.carregando = false;
        this.erro = err.error?.message ?? 'Erro ao redefinir senha.';
      },
    });
  }

  alternarModo(): void {
    this.modo = this.modo === 'login' ? 'cadastro' : 'login';
    this.limparFormulario();
  }

  abrirRecuperacao(): void {
    this.modo = 'recuperar';
    this.erro = '';
    this.sucesso = '';
    this.senha = '';
    this.confirmarSenha = '';
  }

  private limparFormulario(): void {
    this.erro = '';
    this.sucesso = '';
    this.nome = '';
    this.senha = '';
    this.confirmarSenha = '';
  }

  private salvarPreferenciaLembrar(): void {
    if (this.lembrar) {
      localStorage.setItem(this.CHAVE_LEMBRAR, this.email);
    } else {
      localStorage.removeItem(this.CHAVE_LEMBRAR);
    }
  }

  private criarCadastro(): void {
    if (!this.nome.trim() || !this.email.trim() || this.senha.length < 8) {
      this.erro = 'Preencha nome, e-mail e uma senha com pelo menos 8 caracteres.';
      return;
    }
    if (this.senha !== this.confirmarSenha) {
      this.erro = 'As senhas não coincidem.';
      return;
    }
    this.carregando = true;
    this.authService.cadastrar(this.nome, this.email, this.senha, this.confirmarSenha).subscribe({
      next: () => {
        this.sucesso = 'Cadastro realizado! Entrando na conta...';
        setTimeout(() => {
          this.authService.entrar(this.email, this.senha).subscribe({
            next: () => {
              this.salvarPreferenciaLembrar();
              this.irParaDestino();
            },
            error: () => {
              this.carregando = false;
              this.erro = 'Cadastro realizado, mas não foi possível iniciar a sessão.';
            },
          });
        }, 1000);
      },
      error: (error) => {
        this.carregando = false;
        this.erro = error.error?.message ?? 'Erro ao realizar cadastro.';
      },
    });
  }

  private irParaDestino(): void {
    const destino = this.route.snapshot.queryParamMap.get('redirect') ?? '/catalogo';
    this.router.navigateByUrl(destino.startsWith('/') ? destino : '/catalogo');
  }
}
