import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Estacao, EstacaoService, HorarioOcupado } from '../../services/estacao.service';
import { ReservasService } from '../../services/reservas.service';
import { ContaRecebimento, PagamentoService } from '../../services/pagamento.service';

@Component({
  selector: 'app-agendamento',
  imports: [FormsModule, RouterLink, DecimalPipe],
  templateUrl: './agendamento.html',
  styleUrl: './agendamento.scss',
})
export class Agendamento implements OnInit {
  selectedEstacao: Estacao | null = null;
  readonly dataMinima = this.formatarDataInput(new Date());
  readonly horarioAbertura = '08:00';
  readonly horarioFechamento = '20:00';
  dataSessao = this.dataMinima;
  duracaoEstimada = 4;
  horarioSelecionado: { inicio: string; fim: string } | null = null;
  observacoes = '';
  nome = '';
  sobrenome = '';
  formaPagamento: 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'DINHEIRO' = 'PIX';
  biosseguranca = true;
  erro = '';
  horariosOcupados: HorarioOcupado[] = [];
  carregandoHorarios = false;
  contaRecebimento: ContaRecebimento | null = null;
  aguardandoPagamento = false;
  semEstacaoSelecionada = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private estacaoService: EstacaoService,
    private reservasService: ReservasService,
    private pagamentoService: PagamentoService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const estacaoIdParam = this.route.snapshot.queryParamMap.get('estacaoId');
    const estacaoId = Number(estacaoIdParam);
    console.log('ID da Estação recebido:', estacaoId);

    if (!estacaoIdParam || !Number.isInteger(estacaoId) || estacaoId <= 0) {
      this.semEstacaoSelecionada = true;
      console.log('Estação não selecionada ou ID inválido.');
      return;
    }

    console.log('Iniciando busca da estação...');
    this.estacaoService.buscarEstacao(estacaoId).subscribe({
      next: (response) => {
        console.log('Dados da estação recebidos:', response.data);
        this.selectedEstacao = response.data;
        this.atualizarHorariosOcupados();
        this.changeDetectorRef.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar estação:', err);
        this.erro = 'Não foi possível carregar a estação selecionada.';
        this.changeDetectorRef.markForCheck();
      },
    });
    this.atualizarHorariosOcupados();
  }

  get valorTotal(): number {
    console.log('Calculando total com:', this.selectedEstacao);
    const preco = this.selectedEstacao?.preco ?? this.selectedEstacao?.preco_por_hora ?? 0;
    return preco * this.duracaoEstimada;
  }

  get periodoFormatado(): string {
    return this.horarioSelecionado ? `${this.horarioSelecionado.inicio} - ${this.horarioSelecionado.fim}` : 'Selecione um horário';
  }

  get dataResumo(): string {
    const [, mes, dia] = this.dataSessao.split('-');
    return mes && dia ? `${dia}/${mes}` : '--/--';
  }

  get slotsDisponiveis(): { inicio: string; fim: string }[] {
    const abertura = this.converterHora(this.horarioAbertura) ?? 0;
    const fechamento = this.converterHora(this.horarioFechamento) ?? 0;
    const duracaoMinutos = this.duracaoEstimada * 60;
    const ocupados = [...this.horariosOcupados]
      .map((ocupado) => ({
        inicio: this.converterHora(ocupado.horario_inicio),
        fim: this.converterHora(ocupado.horario_fim),
      }))
      .filter((bloco): bloco is { inicio: number; fim: number } => bloco.inicio !== null && bloco.fim !== null);

    const slots: { inicio: string; fim: string }[] = [];

    for (let inicio = abertura; inicio + duracaoMinutos <= fechamento; inicio += 60) {
      const fim = inicio + duracaoMinutos;
      const conflita = ocupados.some((bloco) => inicio < bloco.fim && fim > bloco.inicio);
      if (!conflita) {
        slots.push({ inicio: this.formatarHora(inicio), fim: this.formatarHora(fim) });
      }
    }

    return slots;
  }

  selecionarHorario(inicio: string, fim: string): void {
    this.horarioSelecionado = { inicio, fim };
  }

  aoMudarDuracao(): void {
    this.horarioSelecionado = null;
  }

  atualizarHorariosOcupados(): void {
    const estacaoId = this.selectedEstacao?.id ?? Number(this.route.snapshot.queryParamMap.get('estacaoId') ?? '0');
    this.horarioSelecionado = null;

    if (!estacaoId || !this.dataSessao) {
      this.horariosOcupados = [];
      return;
    }

    this.carregandoHorarios = true;
    this.estacaoService.buscarHorariosOcupados(estacaoId, this.dataSessao).subscribe({
      next: (response) => {
        this.horariosOcupados = response.data ?? [];
        this.carregandoHorarios = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.horariosOcupados = [];
        this.carregandoHorarios = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  confirmar(): void {
    this.erro = '';

    if (!this.nome.trim() || !this.sobrenome.trim()) {
      this.erro = 'Informe seu nome e sobrenome para a reserva.';
      return;
    }

    if (!this.dataSessao || this.dataSessao < this.dataMinima) {
      this.erro = 'Escolha uma data válida para a sessão.';
      return;
    }

    if (!this.horarioSelecionado) {
      this.erro = 'Selecione um horário disponível para a sessão.';
      return;
    }

    if (!this.biosseguranca) {
      this.erro = 'Confirme o termo de biossegurança para continuar.';
      return;
    }

    this.reservasService.adicionarReserva(
      this.selectedEstacao?.id ?? 0,
      this.dataSessao,
      this.horarioSelecionado.inicio,
      this.horarioSelecionado.fim,
      this.observacoes,
      `${this.nome.trim()} ${this.sobrenome.trim()}`,
      this.formaPagamento,
    ).subscribe({
      next: () => {
        this.reservasService.carregarReservas();
        if (this.formaPagamento === 'PIX') {
          this.mostrarInstrucoesPagamento();
        } else {
          this.router.navigate(['/minhas-reservas']);
        }
      },
      error: (error) => {
        this.erro = error.status === 409
          ? 'Este horário já está reservado. Escolha outro período.'
          : error.error?.message ?? 'Não foi possível criar a reserva.';
        this.atualizarHorariosOcupados();
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  private mostrarInstrucoesPagamento(): void {
    this.aguardandoPagamento = true;
    this.pagamentoService.buscarContaRecebimento().subscribe({
      next: (response) => {
        this.contaRecebimento = response.data ?? null;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.contaRecebimento = null;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  concluirPagamento(): void {
    this.router.navigate(['/minhas-reservas']);
  }

  private converterHora(hora: string): number | null {
    const [horas, minutos] = hora.split(':').map(Number);
    return Number.isFinite(horas) && Number.isFinite(minutos) ? horas * 60 + minutos : null;
  }

  private formatarHora(minutos: number): string {
    const horas = Math.floor(minutos / 60).toString().padStart(2, '0');
    const min = (minutos % 60).toString().padStart(2, '0');
    return `${horas}:${min}`;
  }

  private formatarDataInput(data: Date): string {
    const ano = data.getFullYear();
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const dia = data.getDate().toString().padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

}
