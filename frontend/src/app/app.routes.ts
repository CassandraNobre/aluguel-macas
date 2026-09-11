import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login').then((page) => page.Login) },
  { path: 'catalogo', loadComponent: () => import('./pages/catalogo/catalogo').then((page) => page.Catalogo), canActivate: [authGuard] },
  { path: 'agendamento', loadComponent: () => import('./pages/agendamento/agendamento').then((page) => page.Agendamento), canActivate: [authGuard] },
  { path: 'minhas-reservas', loadComponent: () => import('./pages/minhas-reservas/minhas-reservas').then((page) => page.MinhasReservas), canActivate: [authGuard] },
  { path: 'reservas-pagas', loadComponent: () => import('./pages/reservas-pagas/reservas-pagas').then((page) => page.ReservasPagas), canActivate: [authGuard] },
  { path: 'cadastro-estacao', loadComponent: () => import('./pages/cadastro-estacao/cadastro-estacao').then((page) => page.CadastroEstacao), canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];
