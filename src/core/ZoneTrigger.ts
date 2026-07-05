export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Dispara `onEnter` una sola vez cuando la posición dada entra en un radio esférico. */
export class ZoneTrigger {
  private readonly center: Vec3;
  private readonly radiusSq: number;
  private readonly onEnter: () => void;
  private fired = false;

  constructor(center: Vec3, radius: number, onEnter: () => void) {
    this.center = center;
    this.radiusSq = radius * radius;
    this.onEnter = onEnter;
  }

  get hasFired(): boolean {
    return this.fired;
  }

  update(position: Vec3): void {
    if (this.fired) return;

    const dx = position.x - this.center.x;
    const dy = position.y - this.center.y;
    const dz = position.z - this.center.z;
    if (dx * dx + dy * dy + dz * dz <= this.radiusSq) {
      this.fired = true;
      this.onEnter();
    }
  }

  reset(): void {
    this.fired = false;
  }
}
