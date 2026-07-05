import { describe, expect, it, vi } from 'vitest';
import { ZoneTrigger } from '../src/core/ZoneTrigger';

const CENTER = { x: 0, y: 0, z: 0 };

describe('ZoneTrigger', () => {
  it('no dispara mientras el jugador está fuera del radio', () => {
    const onEnter = vi.fn();
    const zone = new ZoneTrigger(CENTER, 2, onEnter);

    zone.update({ x: 10, y: 0, z: 0 });

    expect(onEnter).not.toHaveBeenCalled();
    expect(zone.hasFired).toBe(false);
  });

  it('dispara la primera vez que el jugador entra al radio', () => {
    const onEnter = vi.fn();
    const zone = new ZoneTrigger(CENTER, 2, onEnter);

    zone.update({ x: 1, y: 0, z: 0 });

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(zone.hasFired).toBe(true);
  });

  it('no vuelve a disparar en actualizaciones siguientes dentro del radio', () => {
    const onEnter = vi.fn();
    const zone = new ZoneTrigger(CENTER, 2, onEnter);

    zone.update({ x: 1, y: 0, z: 0 });
    zone.update({ x: 0.5, y: 0, z: 0 });
    zone.update({ x: 1.5, y: 0, z: 0 });

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('considera el borde exacto del radio como "dentro"', () => {
    const onEnter = vi.fn();
    const zone = new ZoneTrigger(CENTER, 2, onEnter);

    zone.update({ x: 2, y: 0, z: 0 });

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('reset() permite disparar de nuevo', () => {
    const onEnter = vi.fn();
    const zone = new ZoneTrigger(CENTER, 2, onEnter);

    zone.update({ x: 0, y: 0, z: 0 });
    zone.reset();
    zone.update({ x: 0, y: 0, z: 0 });

    expect(onEnter).toHaveBeenCalledTimes(2);
    expect(zone.hasFired).toBe(true);
  });
});
