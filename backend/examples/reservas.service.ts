import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

export type ReservaStatus = 'confirmada' | 'concluida' | 'pendente' | 'cancelada';
export type ReservaClasseStatus = 'confirmed' | 'completed' | 'pending' | 'canceled';

export interface Reserva {
  id: number;
  usuario_id?: number;
  estacao_id: number;
  estacao?: string;
  data: string; // DD/MM/YYYY (para UI)
  horario_inicio: string;
  horario_fim: string;
  periodo?: string; // HH:MM - HH:MM
  duracao: number;
  valor_total: number;
  valor?: string; // R$ XXX,XX (formatado)
  observacoes?: string;
  status: ReservaStatus;
  classeStatus?: ReservaClasseStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CriarReservaRequest {
  estacao_id: number;
  data: string; // YYYY-MM-DD (para backend)
  horario_inicio: string;
  horario_fim: string;
  observacoes?: string;
}

export interface ReservaResponse {
  success: boolean;
  status: number;
  message: string;
  data: Reserva | Reserva[];
}

@Injectable({
  providedIn: 'root',
})
export class ReservasService {
  private apiUrl = 'http://localhost:3000/api';
  private reservasSubject = new BehaviorSubject<Reserva[]>([]);
  public reservas$ = this.reservasSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Carregar reservas quando usuário fizer login
    this.authService.usuario$.subscribe((usuario) => {
      if (usuario) {
        this.carregarReservas();
      } else {
        this.reservasSubject.next([]);
      }
    });
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Obter headers com token de autenticação
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.token;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  /**
   * Converter resposta do backend para formato do frontend
   */
  private converterReservaBackend(reserva: any): Reserva {
    const statusMapClasse: { [key: string]: ReservaClasseStatus } = {
      confirmada: 'confirmed',
      concluida: 'completed',
      pendente: 'pending',
      cancelada: 'canceled'
    };

    return {
      id: reserva.id,
      usuario_id: reserva.usuario_id,
      estacao_id: reserva.estacao_id,
      estacao: reserva.estacao_nome || `Estação #${reserva.estacao_id}`,
      data: this.converterDataBackendParaUI(reserva.data),
      horario_inicio: reserva.horario_inicio,
      horario_fim: reserva.horario_fim,
      periodo: `${reserva.horario_inicio} - ${reserva.horario_fim}`,
      duracao: reserva.duracao,
      valor_total: parseFloat(reserva.valor_total),
      valor: `R$ ${parseFloat(reserva.valor_total).toFixed(2).replace('.', ',')}`,
      observacoes: reserva.observacoes,
      status: reserva.status as ReservaStatus,
      classeStatus: statusMapClasse[reserva.status] || 'pending',
      created_at: reserva.created_at,
      updated_at: reserva.updated_at
    };
  }

  /**
   * Converter data do backend (YYYY-MM-DD) para UI (DD/MM/YYYY)
   */
  private converterDataBackendParaUI(data: string): string {
    const [year, month, day] = data.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Converter data da UI (DD/MM/YYYY) para backend (YYYY-MM-DD)
   */
  private converterDataUIParaBackend(data: string): string {
    const [day, month, year] = data.split('/');
    return `${year}-${month}-${day}`;
  }

  /**
   * Converter hora (HH:MM) para minutos
   */
  private converterHora(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Carregar reservas do backend
   */
  carregarReservas(): void {
    if (!this.authService.estaAutenticado) {
      this.reservasSubject.next([]);
      return;
    }

    this.http
      .get<any>(`${this.apiUrl}/reservas`, { headers: this.getHeaders() })
      .subscribe({
        next: (response) => {
          if (response.success && Array.isArray(response.data)) {
            const reservas = response.data.map((r: any) => this.converterReservaBackend(r));
            this.reservasSubject.next(reservas);
          } else {
            this.reservasSubject.next([]);
          }
        },
        error: (error) => {
          console.error('Erro ao carregar reservas:', error);
          this.reservasSubject.next([]);
        }
      });
  }

  /**
   * Obter lista atual de reservas
   */
  getReservas(): Reserva[] {
    return this.reservasSubject.value;
  }

  /**
   * Criar nova reserva
   */
  adicionarReserva(
    estacao_id: number,
    data: string, // DD/MM/YYYY
    horario_inicio: string,
    horario_fim: string,
    observacoes = ''
  ): Observable<any> {
    const dataBackend = this.converterDataUIParaBackend(data);

    const request: CriarReservaRequest = {
      estacao_id,
      data: dataBackend,
      horario_inicio,
      horario_fim,
      observacoes
    };

    return new Observable((observer) => {
      this.http
        .post<any>(`${this.apiUrl}/reservas`, request, {
          headers: this.getHeaders()
        })
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const novaReserva = this.converterReservaBackend(response.data);
              const reservasAtuais = this.reservasSubject.value;
              this.reservasSubject.next([novaReserva, ...reservasAtuais]);
              observer.next(response);
              observer.complete();
            } else {
              observer.error(new Error(response.message || 'Falha ao criar reserva'));
            }
          },
          error: (error) => {
            const mensagem = error.error?.message || 'Erro ao criar reserva';
            observer.error({ error: { message: mensagem } });
          }
        });
    });
  }

  /**
   * Verificar conflito de horário
   */
  temConflito(
    estacao_id: number,
    data: string, // DD/MM/YYYY
    horario_inicio: string,
    horario_fim: string
  ): Observable<boolean> {
    const dataBackend = this.converterDataUIParaBackend(data);

    return new Observable((observer) => {
      this.http
        .get<any>(
          `${this.apiUrl}/estacoes/${estacao_id}/disponibilidade?data=${dataBackend}`
        )
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const disponibilidade = response.data;
              const novoInicio = this.converterHora(horario_inicio);
              const novoFim = this.converterHora(horario_fim);

              const temConflito = disponibilidade.horarios_ocupados.some(
                (ocupado: any) => {
                  const existeInicio = this.converterHora(ocupado.horario_inicio);
                  const existeFim = this.converterHora(ocupado.horario_fim);
                  return novoInicio < existeFim && novoFim > existeInicio;
                }
              );

              observer.next(temConflito);
              observer.complete();
            } else {
              observer.next(false);
              observer.complete();
            }
          },
          error: () => {
            observer.next(false);
            observer.complete();
          }
        });
    });
  }

  /**
   * Cancelar reserva
   */
  cancelarReserva(id: number): Observable<any> {
    return new Observable((observer) => {
      this.http
        .patch<any>(`${this.apiUrl}/reservas/${id}/cancelar`, {}, {
          headers: this.getHeaders()
        })
        .subscribe({
          next: (response) => {
            if (response.success) {
              // Atualizar lista local
              const reservas = this.reservasSubject.value.map((r) => {
                if (r.id === id) {
                  return {
                    ...r,
                    status: 'cancelada' as ReservaStatus,
                    classeStatus: 'canceled' as ReservaClasseStatus
                  };
                }
                return r;
              });
              this.reservasSubject.next(reservas);
              observer.next(response);
              observer.complete();
            } else {
              observer.error(new Error(response.message || 'Falha ao cancelar reserva'));
            }
          },
          error: (error) => {
            const mensagem = error.error?.message || 'Erro ao cancelar reserva';
            observer.error({ error: { message: mensagem } });
          }
        });
    });
  }

  /**
   * Obter reserva específica
   */
  obterReserva(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reservas/${id}`, {
      headers: this.getHeaders()
    });
  }
}
