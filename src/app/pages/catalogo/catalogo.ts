import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Estacao, EstacaoService } from '../../services/estacao.service';

@Component({
  selector: 'app-catalogo',
  imports: [RouterLink],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})
export class Catalogo implements OnInit {
  estacoes: Estacao[] = [];
  carregando = true;
  erro = '';

  constructor(
    private estacaoService: EstacaoService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.estacaoService.listarEstacoes().subscribe({
      next: (response) => {
        this.estacoes = response.data ?? [];
        this.carregando = false;
        // Atualiza a view quando a resposta assíncrona termina fora do ciclo atual.
        this.cdr.markForCheck();
      },
      error: () => {
        this.erro = 'Não foi possível carregar as estações.';
        this.carregando = false;
        this.cdr.markForCheck();
      },
    });
  }

  imagem(estacao: Estacao): string {
    const imagensLocais: Record<number, string> = {
      1: 'img/Estacao_01_Maca_Hidraulica_Inox.png',
      2: 'img/Estacao_02_Sessoes_Longas_Suporte_Maquinas.png',
      3: 'img/Estacao_03_Iluminacao_Precisao_Autoclave.png',
      4: 'img/Estacao_04_Workstation_Inox_Luz_Direcionada.png',
    };

    return estacao.imagem_url ?? imagensLocais[estacao.id] ?? 'img/Estacao_01_Maca_Hidraulica_Inox.png';
  }

  recursos(estacao: Estacao): string[] {
    if (Array.isArray(estacao.recursos)) return estacao.recursos;
    try { return estacao.recursos ? JSON.parse(estacao.recursos) as string[] : []; } catch { return []; }
  }
}

