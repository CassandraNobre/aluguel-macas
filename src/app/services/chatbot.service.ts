import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatbotResponse {
  success?: boolean;
  message?: string;
  data?: {
    message?: string;
    resposta?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  enviarMensagem(message: string): Observable<ChatbotResponse> {
    return this.http.post<ChatbotResponse>(`${this.apiUrl}/chatbot`, { message });
  }
}
