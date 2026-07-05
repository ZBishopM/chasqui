import { describe, expect, it } from 'vitest';
import { CamaquenTracker } from '../src/core/Camaquen';

describe('CamaquenTracker', () => {
  it('empieza en cero: sin poder, sin visibilidad, marca de anillos por defecto', () => {
    const c = new CamaquenTracker();
    expect(c.poder).toBe(0);
    expect(c.visibilidad).toBe(0);
    expect(c.marca).toBe('anillos');
  });

  it('acumula sangre y oro en el poder total', () => {
    const c = new CamaquenTracker();
    c.addSangre(10);
    c.addOro(5);
    expect(c.poder).toBe(15);
  });

  it('la sangre marca más visibilidad que la misma cantidad de oro', () => {
    const bySangre = new CamaquenTracker();
    bySangre.addSangre(10);
    const byOro = new CamaquenTracker();
    byOro.addOro(10);

    expect(bySangre.visibilidad).toBeGreaterThan(byOro.visibilidad);
  });

  it('la visibilidad nunca decrece al seguir acumulando sangre u oro', () => {
    const c = new CamaquenTracker();
    const v0 = c.visibilidad;
    c.addSangre(3);
    const v1 = c.visibilidad;
    c.addOro(3);
    const v2 = c.visibilidad;

    expect(v1).toBeGreaterThanOrEqual(v0);
    expect(v2).toBeGreaterThanOrEqual(v1);
  });

  it('la visibilidad se satura entre 0 y 1 incluso con acumulación extrema', () => {
    const c = new CamaquenTracker();
    c.addSangre(100000);

    expect(c.visibilidad).toBeLessThanOrEqual(1);
    expect(c.visibilidad).toBeGreaterThan(0);
  });

  it('marca "anillos" cuando el Camaquen viene casi todo de oro (ruta del mensajero)', () => {
    const c = new CamaquenTracker();
    c.addOro(20);
    c.addSangre(1);
    expect(c.marca).toBe('anillos');
  });

  it('marca "relieve" cuando el Camaquen viene casi todo de sangre (ruta del monstruo)', () => {
    const c = new CamaquenTracker();
    c.addSangre(20);
    c.addOro(1);
    expect(c.marca).toBe('relieve');
  });

  it('marca "mixto" cuando sangre y oro están balanceados', () => {
    const c = new CamaquenTracker();
    c.addSangre(10);
    c.addOro(10);
    expect(c.marca).toBe('mixto');
  });
});
