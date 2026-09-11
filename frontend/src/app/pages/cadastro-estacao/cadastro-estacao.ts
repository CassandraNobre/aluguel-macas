import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Estacao, EstacaoService } from '../../services/estacao.service';

@Component({ selector: 'app-cadastro-estacao', imports: [FormsModule, RouterLink], templateUrl: './cadastro-estacao.html', styleUrl: './cadastro-estacao.scss' })
export class CadastroEstacao implements OnInit {
  private readonly cacheKey = 'inkstation-estacoes-cache';
  nome = ''; categoria = ''; descricao = ''; precoPorHora: number | null = null; imagem: File | undefined; recursos = '';
  erro = ''; sucesso = ''; salvando = false;
  editandoId: number | null = null;
  estacoes: Estacao[] = this.carregarCache();
  carregandoEstacoes = this.estacoes.length === 0;

  constructor(private estacaoService: EstacaoService, private router: Router) {}

  ngOnInit(): void {
    this.carregarEstacoes();
  }

  carregarEstacoes(): void {
    this.carregandoEstacoes = true;
    this.estacaoService.listarEstacoes().subscribe({
      next: (response) => {
        this.estacoes = response.data ?? [];
        localStorage.setItem(this.cacheKey, JSON.stringify(this.estacoes));
        this.carregandoEstacoes = false;
      },
      error: () => { this.erro = 'Não foi possível carregar as estações existentes.'; this.carregandoEstacoes = false; },
    });
  }

  apagar(estacao: Estacao): void {
    if (!estacao.id || !window.confirm(`Apagar a estação ${estacao.nome}?`)) return;
    this.estacaoService.apagarEstacao(estacao.id).subscribe({
      next: () => {
        this.estacoes = this.estacoes.filter((item) => item.id !== estacao.id);
        localStorage.setItem(this.cacheKey, JSON.stringify(this.estacoes));
        this.sucesso = 'Estação apagada.';
      },
      error: () => { this.erro = 'Não foi possível apagar a estação.'; },
    });
  }

  editar(estacao: Estacao): void {
    this.editandoId = estacao.id;
    this.nome = estacao.nome; this.categoria = estacao.categoria ?? '';
    this.descricao = estacao.descricao; this.precoPorHora = estacao.preco_por_hora ?? estacao.preco ?? null;
    this.recursos = Array.isArray(estacao.recursos) ? estacao.recursos.join(', ') : (estacao.recursos ?? '');
    this.imagem = undefined;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicao(): void {
    this.editandoId = null; this.nome = ''; this.categoria = ''; this.descricao = '';
    this.precoPorHora = null; this.recursos = ''; this.imagem = undefined;
  }

  escolherImagem(event: Event): void {
    const arquivo = (event.target as HTMLInputElement).files?.[0];
    if (!arquivo) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type) || arquivo.size > 5 * 1024 * 1024) {
      this.erro = 'Escolha uma imagem JPG, PNG ou WebP de até 5 MB.';
      this.imagem = undefined;
      return;
    }
    this.erro = '';
    this.imagem = arquivo;
  }

  salvar(): void {
    this.erro = ''; this.sucesso = '';
    if (!this.nome.trim() || !this.descricao.trim() || !this.precoPorHora || this.precoPorHora <= 0) {
      this.erro = 'Preencha o nome, a descrição e um preço válido.'; return;
    }
    this.salvando = true;
    const idEditado = this.editandoId;
    const dados = { nome: this.nome.trim(), categoria: this.categoria.trim(), descricao: this.descricao.trim(), preco_por_hora: this.precoPorHora, recursos: this.recursos };
    const operacao = this.editandoId ? this.estacaoService.atualizarEstacao(this.editandoId, dados, this.imagem) : this.estacaoService.cadastrarEstacao(dados, this.imagem);
    operacao.subscribe({
      next: (response) => {
        this.salvando = false;
        this.estacoes = idEditado ? this.estacoes.map((item) => item.id === response.data.id ? response.data : item) : [response.data, ...this.estacoes];
        localStorage.setItem(this.cacheKey, JSON.stringify(this.estacoes));
        this.sucesso = idEditado ? 'Estação atualizada com sucesso.' : 'Estação cadastrada com sucesso.';
        this.cancelarEdicao();
        if (!idEditado) setTimeout(() => this.router.navigate(['/catalogo']), 700);
      },
      error: (error) => { this.salvando = false; this.erro = error.error?.message ?? 'Não foi possível cadastrar a estação.'; },
    });
  }

  private carregarCache(): Estacao[] {
    try {
      const cache = localStorage.getItem(this.cacheKey);
      const estacoes = cache ? JSON.parse(cache) as Estacao[] : [];
      return Array.isArray(estacoes) ? estacoes : [];
    } catch {
      return [];
    }
  }
}
