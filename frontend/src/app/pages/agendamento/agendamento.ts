import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Estacao, EstacaoService } from '../../services/estacao.service';
import { ReservasService } from '../../services/reservas.service';

@Component({
  selector: 'app-agendamento',
  imports: [FormsModule],
  templateUrl: './agendamento.html',
  styleUrl: './agendamento.scss',
})
export class Agendamento implements OnInit {
  selectedEstacao: Estacao | null = null;
  readonly dataMinima = this.formatarDataInput(new Date());
  dataSessao = this.dataMinima;
  horarioInicio = '09:00';
  horarioFim = '13:00';
  duracaoEstimada = 4;
  observacoes = '';
  biosseguranca = true;
  erro = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private estacaoService: EstacaoService,
    private reservasService: ReservasService,
  ) {}

  ngOnInit(): void {
    const estacaoId = Number(this.route.snapshot.queryParamMap.get('estacaoId') ?? '1');
    this.estacaoService.buscarEstacao(estacaoId).subscribe({
      next: (response) => this.selectedEstacao = response.data,
      error: () => this.erro = 'Não foi possível carregar a estação selecionada.',
    });
  }

  get valorTotal(): number {
    return (this.selectedEstacao?.preco_por_hora ?? 0) * this.horasReservadas;
  }

  get horasReservadas(): number {
    const inicio = this.converterHora(this.horarioInicio);
    const fim = this.converterHora(this.horarioFim);
    return inicio !== null && fim !== null && fim > inicio ? (fim - inicio) / 60 : 0;
  }

  get periodoFormatado(): string {
    return `${this.horarioInicio} - ${this.horarioFim}`;
  }

  get dataResumo(): string {
    const [, mes, dia] = this.dataSessao.split('-');
    return mes && dia ? `${dia}/${mes}` : '--/--';
  }

  atualizarHorarioFinal(): void {
    const inicio = this.converterHora(this.horarioInicio);

    if (inicio === null) {
      return;
    }

    const fim = inicio + this.duracaoEstimada * 60;
    const horas = Math.floor(fim / 60).toString().padStart(2, '0');
    const minutos = (fim % 60).toString().padStart(2, '0');
    this.horarioFim = `${horas}:${minutos}`;
  }

  confirmar(): void {
    this.erro = '';

    if (!this.dataSessao || this.dataSessao < this.dataMinima) {
      this.erro = 'Escolha uma data válida para a sessão.';
      return;
    }

    if (this.horasReservadas <= 0) {
      this.erro = 'O horário de término deve ser posterior ao horário de início.';
      return;
    }

    if (!this.biosseguranca) {
      this.erro = 'Confirme o termo de biossegurança para continuar.';
      return;
    }

    this.reservasService.adicionarReserva(
      this.selectedEstacao?.id ?? 0,
      this.dataSessao,
      this.horarioInicio,
      this.horarioFim,
      this.observacoes,
    ).subscribe({
      next: () => {
        this.reservasService.carregarReservas();
        this.router.navigate(['/minhas-reservas']);
      },
      error: (error) => {
        this.erro = error.status === 409
          ? 'Este horário já está reservado. Escolha outro período.'
          : error.error?.message ?? 'Não foi possível criar a reserva.';
      },
    });
  }

  private converterHora(hora: string): number | null {
    const [horas, minutos] = hora.split(':').map(Number);
    return Number.isFinite(horas) && Number.isFinite(minutos) ? horas * 60 + minutos : null;
  }

  private formatarDataInput(data: Date): string {
    const ano = data.getFullYear();
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const dia = data.getDate().toString().padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

}
