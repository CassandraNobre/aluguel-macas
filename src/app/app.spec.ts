import { beforeEach, describe, expect, it } from 'vitest';
import { ReservasService } from './services/reservas.service';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create the app', () => {
    const service = new ReservasService();
    expect(service).toBeTruthy();
  });

  it('should persist a new reservation in localStorage', () => {
    const service = new ReservasService();

    service.adicionarReserva('Estação #99', '01/01/2027', '10:00 - 14:00', 200);

    const stored = JSON.parse(localStorage.getItem('inkstation-reservas') ?? '[]');

    expect(Array.isArray(stored)).toBe(true);
    expect(stored.some((reserva: { estacao: string }) => reserva.estacao === 'Estação #99')).toBe(true);
  });

  it('should reject overlapping reservations for the same station', () => {
    const service = new ReservasService();

    const created = service.adicionarReserva('Estação #01', '01/01/2027', '10:00 - 12:00', 70);
    const overlapping = service.adicionarReserva('Estação #01', '01/01/2027', '11:00 - 13:00', 70);
    const differentStation = service.adicionarReserva('Estação #02', '01/01/2027', '11:00 - 13:00', 84);

    expect(created).toBe(true);
    expect(overlapping).toBe(false);
    expect(differentStation).toBe(true);
  });
});
