import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Estacao, EstacaoService } from '../../services/estacao.service';
import { API_URL } from '../../services/api.config';

@Component({ selector: 'app-cadastro-estacao', imports: [FormsModule, RouterLink], templateUrl: './cadastro-estacao.html', styleUrl: './cadastro-estacao.scss' })
export class CadastroEstacao implements OnInit {
  private readonly cacheKey = 'inkstation-estacoes-cache';
  nome = ''; categoria = ''; descricao = ''; precoPorHora: number | null = null; imagem: File | undefined; recursos = '';
  erro = ''; sucesso = ''; salvando = false; processandoImagem = false;
  editandoId: number | null = null;
  estacoes: Estacao[] = this.carregarCache();
  carregandoEstacoes = this.estacoes.length === 0;

  constructor(private estacaoService: EstacaoService, private router: Router) {}

  imagemUrl(estacao: Estacao): string {
    const nomeArquivo = estacao.imagem_url?.split(/[\\/]/).pop();
    return nomeArquivo ? `${API_URL.replace('/api', '')}/uploads/${nomeArquivo}` : `${API_URL.replace('/api', '')}/uploads/Estacao_01_Maca_Hidraulica_Inox.png`;
  }

  ngOnInit(): void {
    this.carregarEstacoes();
  }

  carregarEstacoes(): void {
    // Mantém o cache visível enquanto busca a versão atualizada.
    this.carregandoEstacoes = this.estacoes.length === 0;
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

  async escolherImagem(event: Event): Promise<void> {
    const arquivo = (event.target as HTMLInputElement).files?.[0];
    if (!arquivo) return;
    const limiteImagem = 20 * 1024 * 1024;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) {
      this.erro = 'Formato inválido. Escolha uma imagem JPG, PNG ou WebP.';
      this.imagem = undefined;
      return;
    }
    if (arquivo.size > limiteImagem) {
      this.erro = `Imagem muito grande (${(arquivo.size / 1024 / 1024).toFixed(1)} MB). O limite é 20 MB.`;
      this.imagem = undefined;
      return;
    }
    this.erro = '';
    this.processandoImagem = true;
    try { this.imagem = await this.comprimirImagem(arquivo); }
    catch { this.erro = 'Não foi possível preparar a imagem.'; this.imagem = arquivo; }
    finally { this.processandoImagem = false; }
  }

  private comprimirImagem(arquivo: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => {
        const imagem = new Image();
        imagem.onload = () => {
          const escala = Math.min(1, 1400 / Math.max(imagem.width, imagem.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(imagem.width * escala); canvas.height = Math.round(imagem.height * escala);
          canvas.getContext('2d')?.drawImage(imagem, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => blob ? resolve(new File([blob], arquivo.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })) : reject(new Error('compressão')), 'image/jpeg', .78);
        };
        imagem.onerror = () => reject(new Error('imagem inválida')); imagem.src = String(leitor.result);
      };
      leitor.onerror = () => reject(new Error('leitura falhou')); leitor.readAsDataURL(arquivo);
    });
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
