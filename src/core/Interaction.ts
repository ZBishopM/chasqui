export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Interactable {
  id: string;
  position: Vec3;
  /** Distancia máxima, en metros, a la que se puede interactuar con este objeto. */
  range: number;
  onInteract(): void;
}

const DEFAULT_VIEW_ANGLE_RAD = (25 * Math.PI) / 180;

function subtract(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function length(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Registro de objetos con los que el Chasqui puede interactuar mirándolos y presionando
 * un botón. Es la base compartida del tutorial (cuna, quipu, diálogo) y, más adelante,
 * del targeting de los poderes que apuntan con un rayo desde la cámara.
 */
export class InteractionSystem {
  private readonly items = new Map<string, Interactable>();

  register(item: Interactable): void {
    this.items.set(item.id, item);
  }

  unregister(id: string): void {
    this.items.delete(id);
  }

  /** Devuelve el interactuable válido más cercano dentro del cono de visión, o null si no hay ninguno. */
  findTarget(
    eye: Vec3,
    lookDir: Vec3,
    maxViewAngleRad: number = DEFAULT_VIEW_ANGLE_RAD,
  ): Interactable | null {
    let best: Interactable | null = null;
    let bestDistance = Infinity;
    const cosMaxAngle = Math.cos(maxViewAngleRad);

    for (const item of this.items.values()) {
      const toItem = subtract(item.position, eye);
      const distance = length(toItem);
      if (distance === 0 || distance > item.range) continue;

      const cosAngle = dot(lookDir, toItem) / (length(lookDir) * distance);
      if (cosAngle < cosMaxAngle) continue;

      if (distance < bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }

    return best;
  }

  interact(eye: Vec3, lookDir: Vec3, maxViewAngleRad?: number): void {
    const target = this.findTarget(eye, lookDir, maxViewAngleRad);
    target?.onInteract();
  }
}
