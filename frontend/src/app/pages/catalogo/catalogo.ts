import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Estacao, EstacaoService } from '../../services/estacao.service';
import { API_URL } from '../../services/api.config';

@Component({
  selector: 'app-catalogo',
  imports: [RouterLink],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})
export class Catalogo implements OnInit {
  private static readonly CACHE_KEY = 'inkstation-estacoes-cache';
  estacoes: Estacao[] = this.carregarCache();
  carregando = this.estacoes.length === 0;
  erro = '';

  constructor(private estacaoService: EstacaoService) {}

  ngOnInit(): void {
    this.estacaoService.listarEstacoes().subscribe({
      next: (response) => {
        this.estacoes = response.data ?? [];
        this.carregando = false;
        localStorage.setItem(Catalogo.CACHE_KEY, JSON.stringify(this.estacoes));
      },
      error: () => {
        this.erro = 'Não foi possível carregar as estações.';
        this.carregando = false;
      },
    });
  }

  imagem(estacao: Estacao): string {
    if (estacao.imagem_url) return estacao.imagem_url.startsWith('http') ? estacao.imagem_url : `${API_URL.replace('/api', '')}${estacao.imagem_url}`;
    return `${API_URL.replace('/api', '')}/uploads/Estacao_01_Maca_Hidraulica_Inox.png`;
  }


  recursos(estacao: Estacao): string[] {
    if (Array.isArray(estacao.recursos)) return estacao.recursos;
    try { return estacao.recursos ? JSON.parse(estacao.recursos) as string[] : []; } catch { return []; }
  }

  private carregarCache(): Estacao[] {
    try {
      const cache = localStorage.getItem(Catalogo.CACHE_KEY);
      const estacoes = cache ? JSON.parse(cache) as Estacao[] : [];
      return Array.isArray(estacoes) ? estacoes : [];
    } catch {
      return [];
    }
  }
}
