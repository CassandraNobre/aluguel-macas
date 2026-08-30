import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { HttpInterceptorFn, HttpResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { catchError, tap } from 'rxjs';
import { throwError } from 'rxjs';

import { routes } from './app.routes';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('inkstation-token');

  if (token) {
    request = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(request);
};

export const debugInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.url.includes('/auth/')) {
    const bodyStr = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
    console.log('📤 REQUEST BODY ENVIADO:', bodyStr);
    console.log('📤 URL:', request.url);
  }

  return next(request).pipe(
    tap((event: any) => {
      if (request.url.includes('/auth/') && event.body) {
        console.log('📥 RESPONSE BODY RECEBIDO:', JSON.stringify(event.body));
      }
    }),
    catchError((error: any) => {
      if (request.url.includes('/auth/')) {
        console.log('❌ ERRO NA RESPOSTA:', {
          status: error.status,
          statusText: error.statusText,
          message: error.error?.message || 'Sem mensagem'
        });
      }
      return throwError(() => error);
    })
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, debugInterceptor])),
  ],
};
