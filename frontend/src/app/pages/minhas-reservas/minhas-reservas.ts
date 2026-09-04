import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Reserva, ReservasService } from '../../services/reservas.service';

@Component({
  selector: 'app-minhas-reservas',
  imports: [RouterLink, AsyncPipe],
  templateUrl: './minhas-reservas.html',
  styleUrl: './minhas-reservas.scss',
})
export class MinhasReservas implements OnInit {
  readonly reservas$;

  constructor(
    private reservasService: ReservasService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    this.reservas$ = this.reservasService.reservas$;
  }

  ngOnInit(): void {
    this.reservasService.carregarReservas();
  }

  podeCancelar(reserva: Reserva): boolean {
    const status = reserva.status.toLowerCase();
    return (status === 'confirmada' || status === 'pendente') && !this.estaPaga(reserva);
  }

  estaPaga(reserva: Reserva): boolean {
    return reserva.pagamento_status === 'PAGO';
  }

  podeMarcarPago(reserva: Reserva): boolean {
    return reserva.pagamento_status === 'PENDENTE';
  }

  marcarPago(reserva: Reserva): void {
    const confirmar = window.confirm(`Confirmar que a reserva da ${this.nomeEstacao(reserva)} já foi paga?`);

    if (!confirmar) {
      return;
    }

    this.reservasService.marcarComoPago(reserva.id).subscribe({
      next: () => this.reservasService.carregarReservas(),
      error: (error) => {
        this.erro = error.error?.message ?? 'Erro ao confirmar pagamento.';
        this.changeDetectorRef.markForCheck();
      },
    });
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
      error: (error) => {
        this.erro = error.error?.message ?? 'Erro ao cancelar reserva.';
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  apagar(reserva: Reserva): void {
    if (this.estaPaga(reserva)) {
      return;
    }

    const confirmar = window.confirm(`Deseja apagar definitivamente a reserva da ${this.nomeEstacao(reserva)}? Esta ação não pode ser desfeita.`);

    if (!confirmar) {
      return;
    }

    this.reservasService.apagarReserva(reserva.id).subscribe({
      next: () => this.reservasService.carregarReservas(),
      error: (error) => {
        this.erro = error.error?.message ?? 'Erro ao apagar reserva.';
        this.changeDetectorRef.markForCheck();
      },
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
    const numero = Number(reserva.valor_total);

    if (!Number.isFinite(numero)) {
      return reserva.valor ?? 'Não informado';
    }

    return `R$ ${numero.toFixed(2).replace('.', ',')}`;
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

