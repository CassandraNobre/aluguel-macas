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
    this.reservas = this.reservasService.getReservas();
  }

  podeCancelar(reserva: Reserva): boolean {
    return reserva.status === 'Confirmada' || reserva.status === 'Pendente';
  }

  cancelar(reserva: Reserva): void {
    if (!this.podeCancelar(reserva)) {
      return;
    }

    const confirmar = window.confirm(`Deseja cancelar a reserva da ${reserva.estacao}?`);

    if (!confirmar) {
      return;
    }

    this.reservasService.removerReserva(reserva.id);
    this.reservas = this.reservasService.getReservas();
  }
}

