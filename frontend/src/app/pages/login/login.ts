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
  etapaRecuperacao: 'solicitar' | 'redefinir' = 'solicitar';

  nome = '';
  email = '';
  senha = '';
  confirmarSenha = '';
  pin = '';
  lembrar = false;
  erro = '';
  sucesso = '';
  carregando = false;

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
      if (this.etapaRecuperacao === 'solicitar') {
        this.solicitarCodigoWhatsApp();
      } else {
        this.confirmarNovaSenhaPin();
      }
      return;
    }

    this.carregando = true;
    this.authService.entrar(this.email, this.senha).subscribe({
      next: () => {
        this.salvarPreferenciaLembrar();
        this.sucesso = 'Login realizado com sucesso!';
        this.carregando = false;
        setTimeout(() => this.irParaDestino(), 1000);
      },
      error: (error) => {
        this.carregando = false;
        this.erro = error.error?.message ?? 'E-mail/Nome ou senha inválidos.';
      },
    });
  }

  solicitarCodigoWhatsApp(): void {
    if (!this.email.trim()) {
      this.erro = 'Informe seu número de WhatsApp.';
      return;
    }

    this.carregando = true;
    this.authService.solicitarRecuperacaoWhatsApp(this.email).subscribe({
      next: (res) => {
        this.carregando = false;
        this.email = res.data.email;
        this.pin = res.data.pin; // Preenche o PIN automaticamente na tela
        this.etapaRecuperacao = 'redefinir';

        if (res.data.whatsappUrl) {
          window.open(res.data.whatsappUrl, '_blank');
        }

        this.sucesso = `Código PIN gerado (${res.data.pin})! Digite sua nova senha abaixo.`;
      },
      error: (err) => {
        this.carregando = false;
        this.erro = err.error?.message ?? 'Número de WhatsApp não encontrado no sistema.';
      },
    });
  }

  confirmarNovaSenhaPin(): void {
    if (!this.pin.trim() || !this.senha || !this.confirmarSenha) {
      this.erro = 'Preencha o código PIN e as senhas.';
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
    this.authService.redefinirSenhaPin(this.email, this.pin, this.senha, this.confirmarSenha).subscribe({
      next: (res) => {
        this.carregando = false;
        this.sucesso = res.message;
        setTimeout(() => {
          this.modo = 'login';
          this.etapaRecuperacao = 'solicitar';
          this.senha = '';
          this.confirmarSenha = '';
          this.pin = '';
        }, 1500);
      },
      error: (err) => {
        this.carregando = false;
        this.erro = err.error?.message ?? 'Código PIN inválido ou expirado.';
      },
    });
  }

  alternarModo(): void {
    this.modo = this.modo === 'login' ? 'cadastro' : 'login';
    this.limparFormulario();
  }

  abrirRecuperacao(): void {
    this.modo = 'recuperar';
    this.etapaRecuperacao = 'solicitar';
    this.erro = '';
    this.sucesso = '';
  }

  private limparFormulario(): void {
    this.erro = '';
    this.sucesso = '';
    this.nome = '';
    this.senha = '';
    this.confirmarSenha = '';
    this.pin = '';
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