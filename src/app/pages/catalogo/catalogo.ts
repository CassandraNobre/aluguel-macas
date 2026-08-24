import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Estacao {
  id: number;
  nome: string;
  categoria: string;
  descricao: string;
  recursos: string[];
  imagem: string;
  imagemAlt: string;
  preco: number;
  avaliacao: number;
}

@Component({
  selector: 'app-catalogo',
  imports: [RouterLink],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})
export class Catalogo {
  readonly estacoes: Estacao[] = [
    {
      id: 1,
      nome: 'Estação #01',
      categoria: 'Premium',
      descricao: 'Maca hidráulica totalmente ajustável, bancada em inox higienizada e luminária articulada em ambiente amplo.',
      recursos: ['Maca hidráulica ajustável', 'Bancada em aço inox', 'Luminária articulada LED', 'Área organizada para insumos'],
      imagem: 'img/Estacao_01_Maca_Hidraulica_Inox.png',
      imagemAlt: 'Estação 01 com maca hidráulica e bancada em inox',
      preco: 35,
      avaliacao: 4.9,
    },
    {
      id: 2,
      nome: 'Estação #02',
      categoria: 'Long Sessions',
      descricao: 'Estrutura ergonômica completa com suporte para máquinas de tattoo, ideal para conforto em trabalhos extensos.',
      recursos: ['Suporte dedicado para máquina', 'Bancada ampla de materiais', 'Espaço de apoio ao cliente', 'Foco em sessões médias e longas'],
      imagem: 'img/Estacao_02_Sessoes_Longas_Suporte_Maquinas.png',
      imagemAlt: 'Estação 02 preparada para sessões longas',
      preco: 42,
      avaliacao: 4.8,
    },
    {
      id: 3,
      nome: 'Estação #03',
      categoria: 'Precision & Biotech',
      descricao: 'Iluminação profissional de alta fidelidade para traços finos, posicionada próxima à sala de esterilização.',
      recursos: ['Iluminação de alta precisão', 'Bancada modular organizada', 'Maca ergonômica reclinável', 'Autoclave e esterilização próxima'],
      imagem: 'img/Estacao_03_Iluminacao_Precisao_Autoclave.png',
      imagemAlt: 'Estação 03 com iluminação profissional e biossegurança',
      preco: 48,
      avaliacao: 5,
    },
    {
      id: 4,
      nome: 'Estação #04',
      categoria: 'Workstation Inox',
      descricao: 'Bancada cirúrgica de inox de alta assepsia com foco de luz direcionada e amplo espaço de movimentação.',
      recursos: ['Bancada 100% em aço inox', 'Foco de luz direcionada', 'Suporte completo para insumos', 'Espaço amplo e higienizado'],
      imagem: 'img/Estacao_04_Workstation_Inox_Luz_Direcionada.png',
      imagemAlt: 'Estação 04 com bancada em inox e luz direcionada',
      preco: 39,
      avaliacao: 4.9,
    },
  ];
}

