import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MinhasReservas } from './minhas-reservas';

describe('MinhasReservas', () => {
  let component: MinhasReservas;
  let fixture: ComponentFixture<MinhasReservas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinhasReservas],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MinhasReservas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
