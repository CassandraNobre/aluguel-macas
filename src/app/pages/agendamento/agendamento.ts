import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservasService } from '../../services/reservas.service';

interface Estacao {
  id: number;
  nome: string;
  preco: number;
}

@Component({
  selector: 'app-agendamento',
  imports: [FormsModule],
  templateUrl: './agendamento.html',
  styleUrl: './agendamento.scss',
})
export class Agendamento implements OnInit {
  readonly estacoes: Estacao[] = [
    { id: 1, nome: 'Estação #01', preco: 35 },
    { id: 2, nome: 'Estação #02', preco: 42 },
    { id: 3, nome: 'Estação #03', preco: 48 },
    { id: 4, nome: 'Estação #04', preco: 39 },
  ];

  selectedEstacao: Estacao = this.estacoes[0];
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
    private reservasService: ReservasService,
  ) {}

  ngOnInit(): void {
    const estacaoId = Number(this.route.snapshot.queryParamMap.get('estacaoId') ?? '1');
    this.selectedEstacao = this.estacoes.find((item) => item.id === estacaoId) ?? this.estacoes[0];
  }

  get valorTotal(): number {
    return this.selectedEstacao.preco * this.horasReservadas;
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

    const reservaCriada = this.reservasService.adicionarReserva(
      this.selectedEstacao.nome,
      this.formatarDataExibicao(this.dataSessao),
      this.periodoFormatado,
      this.valorTotal,
      this.observacoes,
    );

    if (!reservaCriada) {
      this.erro = 'Já existe uma reserva ativa para esta estação nesse período. Escolha outro horário.';
      return;
    }

    this.router.navigate(['/minhas-reservas']);
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

  private formatarDataExibicao(data: string): string {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
}
