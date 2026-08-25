import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Reserva {
  id: number;
  usuario_id: number;
  estacao_id: number;
  estacao: string;
  data: string;
  periodo: string;
  horario_inicio: string;
  horario_fim: string;
  estacao_nome?: string;
  valor_total?: number;
  valor?: string;
  observacoes?: string;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReservasService {
  private readonly apiUrl = 'http://localhost:3000/api';
  private readonly reservasSubject = new BehaviorSubject<Reserva[]>([]);
  readonly reservas$ = this.reservasSubject.asObservable();

  constructor(private http: HttpClient) {}

  carregarReservas(): void {
    this.http.get<{ data: Reserva[] }>(`${this.apiUrl}/reservas`).subscribe({
      next: (response) => this.reservasSubject.next(response.data ?? []),
      error: (error) => {
        if (error.status === 401) this.reservasSubject.next([]);
      },
    });
  }

  adicionarReserva(estacao_id: number, data: string, horario_inicio: string, horario_fim: string, observacoes = ''): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/reservas`, { estacao_id, data, horario_inicio, horario_fim, observacoes });
  }

  cancelarReserva(id: number): Observable<unknown> {
    return this.http.patch(`${this.apiUrl}/reservas/${id}/cancelar`, {});
  }
}
