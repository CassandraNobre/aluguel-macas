import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';

export interface ContaRecebimento {
  titular: string;
  tipo_chave_pix: string;
  chave_pix: string;
  banco?: string;
  agencia?: string;
  conta?: string;
}

@Injectable({ providedIn: 'root' })
export class PagamentoService {
  private readonly apiUrl = API_URL;

  constructor(private http: HttpClient) {}

  buscarContaRecebimento(): Observable<{ data: ContaRecebimento | null }> {
    return this.http.get<{ data: ContaRecebimento | null }>(`${this.apiUrl}/contas-recebimento`);
  }
}
