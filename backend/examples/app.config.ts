import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';
import { AuthInterceptor } from './auth/auth.interceptor';

/**
 * Configuração da aplicação Angular
 * 
 * Este arquivo configura:
 * 1. Router (para navegação)
 * 2. HttpClientModule (para requisições HTTP)
 * 3. AuthInterceptor (para adicionar token em requisições)
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Router
    provideRouter(routes),

    // HTTP Client
    importProvidersFrom(HttpClientModule),

    // Interceptor de autenticação
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
};
