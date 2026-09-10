import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { API_URL } from './api.config';

// Interface espelhando exatamente as colunas do banco PostgreSQL + aliases do SELECT
export interface Reserva {
  id?: number;
  usuario_id?: number;
  nome_cliente?: string;
  estacao_id: number;
  estacao_nome?: string;
  estacao_preco?: number;
  data: string;           // Mapeado de entrada_data
  horario_inicio: string; // Mapeado de entrada_hora
  horario_fim: string;    // Mapeado de saida_hora
  status: 'CONFIRMADA' | 'CONCLUIDA' | 'CANCELADA';
  forma_pagamento?: 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'DINHEIRO';
  observacoes?: string;
  valor_total?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ReservasService {
  private readonly apiUrl = API_URL;
  private readonly reservasSubject = new BehaviorSubject<Reserva[]>([]);
  readonly reservas$ = this.reservasSubject.asObservable();

  constructor(private http: HttpClient) {}

  carregarReservas(): void {
    this.http.get<{ data?: Reserva[] } | Reserva[]>(`${this.apiUrl}/reservas`).subscribe({
      next: (response) => {
        const reservas = Array.isArray(response)
          ? response
          : (response as { data?: Reserva[] }).data ?? [];
        this.reservasSubject.next(reservas);
      },
      error: (error) => {
        this.reservasSubject.next([]);
        console.error('Erro ao carregar reservas:', error);
      },
    });
  }

  adicionarReserva(
    estacao_id: number,
    data: string,
    horario_inicio: string,
    horario_fim: string,
    observacoes = '',
    nome_cliente = '',
    forma_pagamento = 'PIX',
  ): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/reservas`, {
      estacao_id,
      data,
      horario_inicio,
      horario_fim,
      observacoes,
      nome_cliente,
      forma_pagamento,
    });
  }

  cancelarReserva(id: number): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/reservas/${id}/cancelar`, {});
  }

  marcarComoPago(id: number): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/reservas/${id}/pagar`, {});
  }

  apagarReserva(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/reservas/${id}`);
  }
}
