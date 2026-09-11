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
      map((reservas) =>
        reservas.filter((reserva) => reserva.status?.toUpperCase() === 'CONCLUIDA')
      )
    );
  }

  ngOnInit(): void {
    this.reservasService.carregarReservas();
  }

  nomeEstacao(reserva: Reserva): string {
    return reserva.estacao_nome ?? `Estação #${reserva.estacao_id}`;
  }

  formatarData(data: string | Date | null | undefined): string {
    if (!data) return 'Não informado';
    const texto = String(data).slice(0, 10);
    const partes = texto.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : texto;
  }

  valor(reserva: Reserva): string {
    const numero = Number(reserva.valor_total);
    return Number.isFinite(numero) && numero > 0
      ? `R$ ${numero.toFixed(2).replace('.', ',')}`
      : 'Não informado';
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
}
