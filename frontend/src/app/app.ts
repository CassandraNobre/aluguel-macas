import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Chatbot } from './components/chatbot/chatbot';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Chatbot],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('aluguel-macas');
  menuAberto = false;

  constructor(
    protected authService: AuthService,
    private router: Router,
  ) {}

  sair(): void {
    this.menuAberto = false;
    this.authService.sair();
    this.router.navigate(['/login']);
  }

  alternarMenu(): void { this.menuAberto = !this.menuAberto; }
  fecharMenu(): void { this.menuAberto = false; }
}
