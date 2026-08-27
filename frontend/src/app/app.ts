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

  constructor(
    protected authService: AuthService,
    private router: Router,
  ) {}

  sair(): void {
    this.authService.sair();
    this.router.navigate(['/login']);
  }
}
