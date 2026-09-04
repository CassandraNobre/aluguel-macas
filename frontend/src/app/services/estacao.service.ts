import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class EstacaoService {
  private readonly apiUrl = API_URL;

  constructor(private http: HttpClient) {}

  listarEstacoes(): Observable<{ data: Estacao[] }> {
    return this.http.get<{ data: Estacao[] }>(`${this.apiUrl}/estacoes`);
  }

  buscarEstacao(id: number): Observable<{ data: Estacao }> {
    return this.http.get<{ data: Estacao }>(`${this.apiUrl}/estacoes/${id}`);
  }

  buscarHorariosOcupados(estacaoId: number, data: string): Observable<{ data: HorarioOcupado[] }> {
    return this.http.get<{ data: HorarioOcupado[] }>(`${this.apiUrl}/estacoes/${estacaoId}/horarios`, { params: { data } });
  }
}