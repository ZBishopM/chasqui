import { describe, expect, it } from 'vitest';
import { GameManager } from '../src/core/GameManager';

describe('GameManager flags', () => {
  it('starts at neutral values', () => {
    const gm = new GameManager();
    expect(gm.flags.relacionHermanos).toBe(50);
    expect(gm.flags.sospechaEspanola).toBe(0);
  });

  it('clamps relacionHermanos between 0 and 100', () => {
    const gm = new GameManager();
    gm.adjustRelacionHermanos(1000);
    expect(gm.flags.relacionHermanos).toBe(100);
    gm.adjustRelacionHermanos(-1000);
    expect(gm.flags.relacionHermanos).toBe(0);
  });

  it('clamps sospechaEspanola between 0 and 100', () => {
    const gm = new GameManager();
    gm.adjustSospechaEspanola(-50);
    expect(gm.flags.sospechaEspanola).toBe(0);
    gm.adjustSospechaEspanola(500);
    expect(gm.flags.sospechaEspanola).toBe(100);
  });
});
