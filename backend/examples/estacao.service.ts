import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Estacao {
  id: number;
  nome: string;
  categoria: string;
  descricao: string;
  preco_por_hora: number;
  imagem_url: string;
  recursos: string[];
  ativa: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Disponibilidade {
  data: string;
  estacao_id: number;
  horarios_ocupados: Array<{ horario_inicio: string; horario_fim: string }>;
  horarios_disponiveis: Array<{ inicio: string; fim: string }>;
}

export interface EstacaoResponse {
  success: boolean;
  status: number;
  message: string;
  data: Estacao | Estacao[];
}

@Injectable({
  providedIn: 'root',
})
export class EstacaoService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Listar todas as estações ativas
   */
  listarEstacoes(): Observable<EstacaoResponse> {
    return this.http.get<EstacaoResponse>(`${this.apiUrl}/estacoes`);
  }

  /**
   * Obter detalhes de uma estação específica
   */
  obterEstacao(id: number): Observable<EstacaoResponse> {
    return this.http.get<EstacaoResponse>(`${this.apiUrl}/estacoes/${id}`);
  }

  /**
   * Verificar disponibilidade de uma estação em uma data
   */
  verificarDisponibilidade(id: number, data: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/estacoes/${id}/disponibilidade?data=${data}`
    );
  }
}
