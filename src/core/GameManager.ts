export interface GameFlags {
  /** 0 = guerra total entre los hermanos, 100 = unión completa. */
  relacionHermanos: number;
  /** 0 = confianza total, 100 = alerta máxima de los españoles. */
  sospechaEspanola: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class GameManager {
  readonly flags: GameFlags = {
    relacionHermanos: 50,
    sospechaEspanola: 0,
  };

  adjustRelacionHermanos(delta: number): void {
    this.flags.relacionHermanos = clamp(this.flags.relacionHermanos + delta, 0, 100);
  }

  adjustSospechaEspanola(delta: number): void {
    this.flags.sospechaEspanola = clamp(this.flags.sospechaEspanola + delta, 0, 100);
  }
}
