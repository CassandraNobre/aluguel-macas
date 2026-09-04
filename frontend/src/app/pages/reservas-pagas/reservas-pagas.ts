import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs';
import { Reserva, ReservasService } from '../../services/reservas.service';

@Component({
  selector: 'app-reservas-pagas',
  imports: [AsyncPipe],
  templateUrl: './reservas-pagas.html',
  styleUrl: './reservas-pagas.scss',
})
export class ReservasPagas implements OnInit {
  readonly reservasPagas$;

  constructor(
    private reservasService: ReservasService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    this.reservasPagas$ = this.reservasService.reservas$.pipe(
      map((reservas) => reservas.filter((reserva) => reserva.pagamento_status === 'PAGO')),
    );
  }

  ngOnInit(): void {
    this.reservasService.carregarReservas();
  }

  nomeEstacao(reserva: Reserva): string {
    return reserva.estacao_nome ?? reserva.estacao ?? `Estação #${reserva.estacao_id}`;
  }

  valor(reserva: Reserva): string {
    const numero = Number(reserva.valor_total);
    return Number.isFinite(numero) ? `R$ ${numero.toFixed(2).replace('.', ',')}` : (reserva.valor ?? 'Não informado');
  }

  formaPagamento(reserva: Reserva): string {
    return {
      PIX: 'Pix',
      CARTAO_CREDITO: 'Cartão de crédito',
      CARTAO_DEBITO: 'Cartão de débito',
      DINHEIRO: 'Dinheiro',
    }[reserva.forma_pagamento ?? 'PIX'] ?? 'Pix';
  }
}
