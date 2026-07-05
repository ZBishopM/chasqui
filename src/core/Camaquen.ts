export type MarcaCamaquen = 'anillos' | 'mixto' | 'relieve';

/** El oro marca mucho menos la piel que la misma cantidad de sangre (GDD §6, §11). */
const ORO_VISIBILITY_WEIGHT = 0.2;
/** Cuánto Camaquen ponderado hace falta acumular para acercarse al brillo máximo. */
const VISIBILITY_SCALE = 15;
/** Proporción de sangre en el poder total a partir de la cual domina el relieve grueso. */
const RELIEVE_THRESHOLD = 2 / 3;
/** Proporción de sangre por debajo de la cual domina el anillo fino y discreto. */
const ANILLOS_THRESHOLD = 1 / 3;

/**
 * Lleva la cuenta del Camaquen (esencia vital) que el Champí absorbe por sangre
 * (ejecuciones) u oro sagrado (sigilo/ofrendas), y deriva de ahí cuán visible
 * y de qué tipo es la marca dorada en la piel del Chasqui.
 */
export class CamaquenTracker {
  private sangre = 0;
  private oro = 0;

  addSangre(amount: number): void {
    this.sangre += amount;
  }

  addOro(amount: number): void {
    this.oro += amount;
  }

  /** Camaquen total acumulado, sin distinguir origen. */
  get poder(): number {
    return this.sangre + this.oro;
  }

  /** 0 (invisible) a 1 (brillo solar constante). La sangre pesa mucho más que el oro. */
  get visibilidad(): number {
    const ponderado = this.sangre + this.oro * ORO_VISIBILITY_WEIGHT;
    return 1 - Math.exp(-ponderado / VISIBILITY_SCALE);
  }

  get marca(): MarcaCamaquen {
    if (this.poder === 0) return 'anillos';
    const proporcionSangre = this.sangre / this.poder;
    if (proporcionSangre >= RELIEVE_THRESHOLD) return 'relieve';
    if (proporcionSangre <= ANILLOS_THRESHOLD) return 'anillos';
    return 'mixto';
  }
}
