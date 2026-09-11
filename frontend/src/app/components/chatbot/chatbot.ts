import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm';

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
  private readonly modelId = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
  private engine?: MLCEngine;
  aberto = false;
  carregando = false;
  progresso = 0;
  mensagem = '';
  erro = '';
  mensagens: Mensagem[] = [
    { autor: 'assistente', texto: 'Olá! Posso ajudar com estações, horários e reservas do InkStation.' },
  ];

  alternar(): void {
    this.aberto = !this.aberto;
    this.erro = '';
  }

  async enviar(): Promise<void> {
    const texto = this.mensagem.trim();
    if (!texto || this.carregando) return;

    this.mensagens.push({ autor: 'usuario', texto });
    this.mensagem = '';
    this.erro = '';
    this.carregando = true;

    try {
      await this.inicializarModelo();
      const resposta = await this.engine!.chat.completions.create({
        messages: [
          { role: 'system', content: 'Você é o assistente do InkStation. Responda em português, seja objetivo e ajude com estações, horários, reservas e pagamentos. Não invente dados.' },
          ...this.mensagens.slice(-12).map((item) => ({
            role: item.autor === 'usuario' ? 'user' as const : 'assistant' as const,
            content: item.texto,
          })),
        ],
        temperature: 0.2,
        max_tokens: 256,
      });
      this.mensagens.push({ autor: 'assistente', texto: resposta.choices[0]?.message.content?.toString() || 'Não consegui gerar uma resposta.' });
    } catch (error) {
      console.error('Erro no WebLLM:', error);
      this.erro = 'Não foi possível carregar a IA. Verifique se seu navegador suporta WebGPU.';
    } finally {
      this.carregando = false;
    }
  }

  private async inicializarModelo(): Promise<void> {
    if (this.engine) return;
    if (!('gpu' in navigator)) throw new Error('WebGPU não disponível');

    this.engine = await CreateMLCEngine(this.modelId, {
      initProgressCallback: (report) => {
        this.progresso = Math.round(report.progress * 100);
      },
    });
  }
}
