import { describe, expect, it } from 'vitest';
import { CAMINO_DEL_MENSAJERO, Journey } from '../src/core/Journey';

describe('CAMINO_DEL_MENSAJERO (datos)', () => {
  it('tiene los 8 departamentos del GDD en orden', () => {
    expect(CAMINO_DEL_MENSAJERO.map((d) => d.nombre)).toEqual([
      'Ayacucho',
      'Huancavelica',
      'Junín',
      'Pasco',
      'Huánuco',
      'Ancash',
      'La Libertad',
      'Cajamarca',
    ]);
  });
});

describe('Journey', () => {
  it('empieza en Ayacucho, en fase de negación', () => {
    const journey = new Journey();
    expect(journey.actual.nombre).toBe('Ayacucho');
    expect(journey.actual.faseDuelo).toBe('negacion');
    expect(journey.esFinal).toBe(false);
  });

  it('ya tiene el Impulso del Halcón desde el inicio (se obtiene en Ayacucho)', () => {
    const journey = new Journey();
    expect(journey.tienePoder('impulso_halcon')).toBe(true);
    expect(journey.tienePoder('lodo_sapo')).toBe(false);
  });

  it('avanzar() mueve al siguiente departamento y desbloquea su poder', () => {
    const journey = new Journey();
    const siguiente = journey.avanzar();

    expect(siguiente.nombre).toBe('Huancavelica');
    expect(journey.actual.nombre).toBe('Huancavelica');
    expect(journey.tienePoder('lodo_sapo')).toBe(true);
  });

  it('Junín no otorga un poder nuevo propio (solo refina el Halcón)', () => {
    const journey = new Journey();
    journey.avanzar(); // Huancavelica
    journey.avanzar(); // Junín

    expect(journey.actual.nombre).toBe('Junín');
    expect(journey.poderesDesbloqueados).toEqual(['impulso_halcon', 'lodo_sapo']);
  });

  it('llega a Cajamarca en fase de clímax tras recorrer los 8 departamentos', () => {
    const journey = new Journey();
    for (let i = 0; i < 7; i++) journey.avanzar();

    expect(journey.actual.nombre).toBe('Cajamarca');
    expect(journey.actual.faseDuelo).toBe('climax');
    expect(journey.esFinal).toBe(true);
  });

  it('no avanza más allá de Cajamarca', () => {
    const journey = new Journey();
    for (let i = 0; i < 20; i++) journey.avanzar();

    expect(journey.actual.nombre).toBe('Cajamarca');
  });

  it('acumula todos los poderes en orden al llegar al final (excepto los departamentos sin poder propio)', () => {
    const journey = new Journey();
    for (let i = 0; i < 7; i++) journey.avanzar();

    expect(journey.poderesDesbloqueados).toEqual([
      'impulso_halcon',
      'lodo_sapo',
      'ignicion_amaru',
      'trueno_condor',
      'vision_puma',
      'vuelo_colibri',
    ]);
  });
});
