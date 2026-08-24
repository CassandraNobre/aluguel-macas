import { Injectable } from '@angular/core';

export type ReservaStatus = 'Confirmada' | 'Concluída' | 'Pendente' | 'Cancelada';
export type ReservaClasseStatus = 'confirmed' | 'completed' | 'pending' | 'canceled';

export interface Reserva {
  id: number;
  estacao: string;
  data: string;
  periodo: string;
  valor: string;
  observacoes?: string;
  status: ReservaStatus;
  classeStatus: ReservaClasseStatus;
}

@Injectable({
  providedIn: 'root',
})
export class ReservasService {
  private static readonly STORAGE_KEY = 'inkstation-reservas';

  private readonly reservasInternas: Reserva[];

  constructor() {
    this.reservasInternas = this.carregarReservas();
  }

  private carregarReservas(): Reserva[] {
    try {
      const dados = localStorage.getItem(ReservasService.STORAGE_KEY);

      if (!dados) {
        return [
          { id: 1, estacao: 'Estação #01', data: '25/08/2026', periodo: '09:00 - 13:00', valor: 'R$ 140,00', status: 'Confirmada', classeStatus: 'confirmed' },
          { id: 2, estacao: 'Estação #02', data: '18/08/2026', periodo: '14:00 - 18:00', valor: 'R$ 168,00', status: 'Concluída', classeStatus: 'completed' },
          { id: 3, estacao: 'Estação #04', data: '10/08/2026', periodo: '10:00 - 12:00', valor: 'R$ 78,00', status: 'Pendente', classeStatus: 'pending' },
          { id: 4, estacao: 'Estação #03', data: '02/08/2026', periodo: '16:00 - 20:00', valor: 'R$ 192,00', status: 'Cancelada', classeStatus: 'canceled' },
        ];
      }

      const reservas = JSON.parse(dados) as Reserva[];
      return Array.isArray(reservas) ? reservas : [];
    } catch {
      return [];
    }
  }

  private salvarReservas(): void {
    try {
      localStorage.setItem(ReservasService.STORAGE_KEY, JSON.stringify(this.reservasInternas));
    } catch {
      // Ignora falhas de armazenamento do navegador.
    }
  }

  getReservas(): Reserva[] {
    return [...this.reservasInternas];
  }

  adicionarReserva(estacao: string, data: string, periodo: string, valor: number, observacoes = ''): boolean {
    if (this.temConflito(estacao, data, periodo)) {
      return false;
    }

    const novoId = this.reservasInternas.length > 0 ? Math.max(...this.reservasInternas.map((reserva) => reserva.id)) + 1 : 1;

    this.reservasInternas.unshift({
      id: novoId,
      estacao,
      data,
      periodo,
      valor: `R$ ${valor.toFixed(2).replace('.', ',')}`,
      observacoes,
      status: 'Confirmada',
      classeStatus: 'confirmed',
    });

    this.salvarReservas();
    return true;
  }

  temConflito(estacao: string, data: string, periodo: string): boolean {
    const novoIntervalo = this.converterPeriodo(periodo);

    if (!novoIntervalo) {
      return false;
    }

    return this.reservasInternas.some((reserva) => {
      if (reserva.estacao !== estacao || reserva.data !== data || reserva.status === 'Cancelada' || reserva.status === 'Concluída') {
        return false;
      }

      const intervaloExistente = this.converterPeriodo(reserva.periodo);
      return intervaloExistente !== null
        && novoIntervalo.inicio < intervaloExistente.fim
        && novoIntervalo.fim > intervaloExistente.inicio;
    });
  }

  removerReserva(id: number): void {
    const indice = this.reservasInternas.findIndex((reserva) => reserva.id === id);

    if (indice === -1) {
      return;
    }

    this.reservasInternas.splice(indice, 1);
    this.salvarReservas();
  }

  private converterPeriodo(periodo: string): { inicio: number; fim: number } | null {
    const [inicioTexto, fimTexto] = periodo.split(' - ');
    const inicio = this.converterHora(inicioTexto);
    const fim = this.converterHora(fimTexto);

    return inicio !== null && fim !== null && fim > inicio ? { inicio, fim } : null;
  }

  private converterHora(hora: string | undefined): number | null {
    if (!hora) {
      return null;
    }

    const [horas, minutos] = hora.split(':').map(Number);
    return Number.isInteger(horas) && Number.isInteger(minutos)
      && horas >= 0 && horas < 24 && minutos >= 0 && minutos < 60
      ? horas * 60 + minutos
      : null;
  }
}
