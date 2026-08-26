import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../../services/chatbot.service';

interface Mensagem {
  autor: 'usuario' | 'assistente';
  texto: string;
}

@Component({
  selector: 'app-chatbot',
  imports: [FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss',
})
export class Chatbot {
  aberto = false;
  carregando = false;
  mensagem = '';
  erro = '';
  mensagens: Mensagem[] = [
    {
      autor: 'assistente',
      texto: 'Olá! Posso ajudar com estações, horários e reservas do InkStation.',
    },
  ];

  constructor(private chatbotService: ChatbotService) {}

  alternar(): void {
    this.aberto = !this.aberto;
    this.erro = '';
  }

  enviar(): void {
    const texto = this.mensagem.trim();

    if (!texto || this.carregando) {
      return;
    }

    this.mensagens.push({ autor: 'usuario', texto });
    this.mensagem = '';
    this.erro = '';
    this.carregando = true;

    this.chatbotService.enviarMensagem(texto).subscribe({
      next: (response) => {
        const resposta = response.data?.message ?? response.data?.resposta ?? response.message;
        this.mensagens.push({
          autor: 'assistente',
          texto: resposta ?? 'Não consegui interpretar a resposta do assistente.',
        });
        this.carregando = false;
      },
      error: () => {
        this.erro = 'O assistente está indisponível no momento.';
        this.carregando = false;
      },
    });
  }
}
