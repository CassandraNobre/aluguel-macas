import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Estacao, EstacaoService } from '../../services/estacao.service';
import { API_URL } from '../../services/api.config';

@Component({
  selector: 'app-catalogo',
  imports: [RouterLink, FormsModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})
export class Catalogo implements OnInit {
  private static readonly CACHE_KEY = 'inkstation-estacoes-cache';
  estacoes: Estacao[] = this.carregarCache();
  carregando = this.estacoes.length === 0;
  erro = '';
  termo = '';
  categoriaSelecionada = '';
  pesquisando = false;

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
    if (estacao.imagem_url) {
      const nomeArquivo = estacao.imagem_url.split(/[\\/]/).pop();
      if (nomeArquivo) return `${API_URL.replace('/api', '')}/uploads/${nomeArquivo}`;
    }
    return `${API_URL.replace('/api', '')}/uploads/Estacao_01_Maca_Hidraulica_Inox.png`;
  }


  recursos(estacao: Estacao): string[] {
    if (Array.isArray(estacao.recursos)) return estacao.recursos;
    try { return estacao.recursos ? JSON.parse(estacao.recursos) as string[] : []; } catch { return []; }
  }

  get estacoesFiltradas(): Estacao[] {
    const normalizar = (valor: unknown) => String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase();
    const termo = normalizar(this.termo);
    return this.estacoes.filter((estacao) => {
      const categoria = estacao.categoria ?? estacao.tipo ?? '';
      const texto = normalizar(`${estacao.nome} ${estacao.descricao} ${categoria}`);
      return (!termo || texto.includes(termo))
        && (!this.categoriaSelecionada || normalizar(categoria) === normalizar(this.categoriaSelecionada));
    });
  }

  alterarCategoria(evento: Event): void {
    this.categoriaSelecionada = (evento.target as HTMLSelectElement).value;
    this.iniciarPesquisa();
  }

  iniciarPesquisa(): void {
    this.pesquisando = true;
    window.setTimeout(() => { this.pesquisando = false; }, 350);
  }

  get categorias(): string[] {
    return [...new Set(this.estacoes.map((estacao) => (estacao.categoria ?? estacao.tipo)?.trim()).filter((categoria): categoria is string => !!categoria))].sort();
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
