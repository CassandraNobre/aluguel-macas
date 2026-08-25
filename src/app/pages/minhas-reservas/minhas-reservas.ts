import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reserva, ReservasService } from '../../services/reservas.service';

@Component({
  selector: 'app-minhas-reservas',
  imports: [RouterLink],
  templateUrl: './minhas-reservas.html',
  styleUrl: './minhas-reservas.scss',
})
export class MinhasReservas implements OnInit {
  reservas: Reserva[] = [];

  constructor(private reservasService: ReservasService) {}

  ngOnInit(): void {
    this.reservasService.reservas$.subscribe((reservas) => this.reservas = reservas);
    this.reservasService.carregarReservas();
  }

  podeCancelar(reserva: Reserva): boolean {
    return reserva.status === 'confirmada' || reserva.status === 'pendente';
  }

  cancelar(reserva: Reserva): void {
    if (!this.podeCancelar(reserva)) {
      return;
    }

    const confirmar = window.confirm(`Deseja cancelar a reserva da ${this.nomeEstacao(reserva)}?`);

    if (!confirmar) {
      return;
    }

    this.reservasService.cancelarReserva(reserva.id).subscribe({
      next: () => this.reservasService.carregarReservas(),
      error: (error) => this.erro = error.error?.message ?? 'Erro ao cancelar reserva.',
    });
  }

  erro = '';

  nomeEstacao(reserva: Reserva): string {
    return reserva.estacao_nome ?? reserva.estacao ?? `Estação #${reserva.estacao_id}`;
  }

  classeStatus(status: string): string {
    return {
      confirmada: 'confirmed',
      pendente: 'pending',
      concluida: 'completed',
      cancelada: 'canceled',
    }[status.toLowerCase()] ?? 'pending';
  }

  valor(reserva: Reserva): string {
    if (typeof reserva.valor_total !== 'number') {
      return reserva.valor ?? 'Não informado';
    }

    return `R$ ${reserva.valor_total.toFixed(2).replace('.', ',')}`;
  }
}

