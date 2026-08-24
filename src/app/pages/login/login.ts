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

    if (!this.authService.entrar(this.email, this.senha, this.lembrar)) {
      this.erro = 'E-mail ou senha inválidos. Use os dados de acesso do estúdio.';
      return;
    }

    this.irParaDestino();
  }

  entrarComGoogle(): void {
    this.erro = '';
    this.authService.entrarComGoogle(this.lembrar);
    this.irParaDestino();
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

    if (!this.authService.cadastrar(this.nome, this.email, this.senha)) {
      this.erro = 'Este e-mail já possui cadastro. Entre com sua senha.';
      return;
    }

    this.authService.entrar(this.email, this.senha, this.lembrar);
    this.irParaDestino();
  }

  private irParaDestino(): void {
    const destino = this.route.snapshot.queryParamMap.get('redirect') ?? '/catalogo';
    this.router.navigateByUrl(destino.startsWith('/') ? destino : '/catalogo');
  }
}
