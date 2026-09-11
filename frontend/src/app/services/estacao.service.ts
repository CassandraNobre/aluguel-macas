import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { API_URL } from './api.config';

export interface Estacao {
  id: number;
  nome: string;
  categoria?: string;
  descricao: string;
  status?: string;
  ativo?: boolean;
  preco?: number;
  preco_por_hora?: number;
  imagem_url?: string;
  recursos?: string[] | string;
  avaliacao?: number;
}

export interface HorarioOcupado {
  horario_inicio: string;
  horario_fim: string;
}

export interface NovaEstacao {
  nome: string;
  categoria: string;
  descricao: string;
  preco_por_hora: number;
  imagem_url?: string;
  recursos?: string;
}

@Injectable({ providedIn: 'root' })
export class EstacaoService {
  private readonly apiUrl = API_URL;
  private estacoes$?: Observable<{ data: Estacao[] }>;

  constructor(private http: HttpClient) {}

  cadastrarEstacao(estacao: NovaEstacao, imagem?: File): Observable<{ data: Estacao }> {
    const dados = new FormData();
    dados.append('nome', estacao.nome);
    dados.append('categoria', estacao.categoria);
    dados.append('descricao', estacao.descricao);
    dados.append('preco_por_hora', String(estacao.preco_por_hora));
    dados.append('recursos', estacao.recursos ?? '');
    if (imagem) dados.append('imagem', imagem, imagem.name);
    return this.http.post<{ data: Estacao }>(`${this.apiUrl}/estacoes`, dados).pipe(tap(() => this.limparCache()));
  }

  listarEstacoes(): Observable<{ data: Estacao[] }> {
    this.estacoes$ ??= this.http.get<{ data: Estacao[] }>(`${this.apiUrl}/estacoes`).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.estacoes$;
  }

  buscarEstacao(id: number): Observable<{ data: Estacao }> {
    return this.http.get<{ data: Estacao }>(`${this.apiUrl}/estacoes/${id}`);
  }

  apagarEstacao(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/estacoes/${id}`).pipe(tap(() => this.limparCache()));
  }

  atualizarEstacao(id: number, estacao: NovaEstacao, imagem?: File): Observable<{ data: Estacao }> {
    const dados = new FormData();
    dados.append('nome', estacao.nome); dados.append('categoria', estacao.categoria);
    dados.append('descricao', estacao.descricao); dados.append('preco_por_hora', String(estacao.preco_por_hora));
    dados.append('recursos', estacao.recursos ?? '');
    if (imagem) dados.append('imagem', imagem, imagem.name);
    return this.http.patch<{ data: Estacao }>(`${this.apiUrl}/estacoes/${id}`, dados).pipe(tap(() => this.limparCache()));
  }

  private limparCache(): void { this.estacoes$ = undefined; }

  buscarHorariosOcupados(estacaoId: number, data: string): Observable<{ data: HorarioOcupado[] }> {
    return this.http.get<{ data: HorarioOcupado[] }>(`${this.apiUrl}/estacoes/${estacaoId}/horarios`, { params: { data } });
  }
}
