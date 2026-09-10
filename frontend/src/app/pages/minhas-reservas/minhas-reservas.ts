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
  erro = '';

  constructor(
    private reservasService: ReservasService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    this.reservas$ = this.reservasService.reservas$;
  }

  ngOnInit(): void {
    this.reservasService.carregarReservas();
  }

  nomeEstacao(reserva: Reserva): string {
    return reserva.estacao_nome ?? `Estação #${reserva.estacao_id}`;
  }

  valor(reserva: Reserva): string {
    const numero = Number(reserva.valor_total);
    if (Number.isFinite(numero) && numero > 0) {
      return `R$ ${numero.toFixed(2).replace('.', ',')}`;
    }
    return 'Não informado';
  }

  formaPagamento(reserva: Reserva): string {
    const mapaPagamento: Record<string, string> = {
      PIX: 'Pix',
      CARTAO_CREDITO: 'Cartão de crédito',
      CARTAO_DEBITO: 'Cartão de débito',
      DINHEIRO: 'Dinheiro',
    };
    const chave = reserva.forma_pagamento ?? 'PIX';
    return mapaPagamento[chave] ?? 'Pix';
  }

  classeStatus(status: string): string {
    const mapaStatus: Record<string, string> = {
      confirmada: 'confirmed',
      pendente: 'pending',
      concluida: 'completed',
      cancelada: 'canceled',
    };
    const chave = status?.toLowerCase() ?? '';
    return mapaStatus[chave] ?? 'pending';
  }

  estaPaga(reserva: Reserva): boolean {
    return reserva.status?.toUpperCase() === 'CONCLUIDA';
  }

  podeCancelar(reserva: Reserva): boolean {
    const s = reserva.status?.toUpperCase();
    return s === 'CONFIRMADA' || s === 'PENDENTE';
  }

  podeMarcarPago(reserva: Reserva): boolean {
    const s = reserva.status?.toUpperCase();
    return s === 'CONFIRMADA' || s === 'PENDENTE';
  }

  cancelar(reserva: Reserva): void {
    if (!reserva.id || !this.podeCancelar(reserva)) return;
    if (!window.confirm(`Deseja cancelar a reserva da ${this.nomeEstacao(reserva)}?`)) return;

    this.reservasService.cancelarReserva(reserva.id).subscribe({
      next: () => this.reservasService.carregarReservas(),
      error: (error) => {
        this.erro = error.error?.message ?? 'Erro ao cancelar reserva.';
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  marcarPago(reserva: Reserva): void {
    if (!reserva.id) return;
    if (!window.confirm(`Confirmar que a reserva da ${this.nomeEstacao(reserva)} já foi paga?`)) return;

    this.reservasService.marcarComoPago(reserva.id).subscribe({
      next: () => this.reservasService.carregarReservas(),
      error: (error) => {
        this.erro = error.error?.message ?? 'Erro ao confirmar pagamento.';
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  apagar(reserva: Reserva): void {
    if (!reserva.id || this.estaPaga(reserva)) return;
    if (!window.confirm(`Deseja apagar definitivamente a reserva da ${this.nomeEstacao(reserva)}? Esta ação não pode ser desfeita.`)) return;

    this.reservasService.apagarReserva(reserva.id).subscribe({
      next: () => this.reservasService.carregarReservas(),
      error: (error) => {
        this.erro = error.error?.message ?? 'Erro ao apagar reserva.';
        this.changeDetectorRef.markForCheck();
      },
    });
  }
}