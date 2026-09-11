import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Catalogo } from './pages/catalogo/catalogo';
import { Agendamento } from './pages/agendamento/agendamento';
import { MinhasReservas } from './pages/minhas-reservas/minhas-reservas';
import { ReservasPagas } from './pages/reservas-pagas/reservas-pagas';
import { CadastroEstacao } from './pages/cadastro-estacao/cadastro-estacao';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'catalogo', component: Catalogo, canActivate: [authGuard] },
  { path: 'agendamento', component: Agendamento, canActivate: [authGuard] },
  { path: 'minhas-reservas', component: MinhasReservas, canActivate: [authGuard] },
  { path: 'reservas-pagas', component: ReservasPagas, canActivate: [authGuard] },
  { path: 'cadastro-estacao', component: CadastroEstacao, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];
