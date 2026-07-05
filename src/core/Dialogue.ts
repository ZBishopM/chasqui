export interface DialogueLine {
  hablante: string;
  texto: string;
}

/** Máquina de estado simple para una secuencia lineal de líneas de diálogo. */
export class Dialogue {
  private readonly lines: readonly DialogueLine[];
  private readonly onComplete?: () => void;
  private index = 0;
  private finished: boolean;

  constructor(lines: readonly DialogueLine[], onComplete?: () => void) {
    this.lines = lines;
    this.onComplete = onComplete;
    this.finished = lines.length === 0;
  }

  get actual(): DialogueLine | null {
    return this.finished ? null : this.lines[this.index];
  }

  get isFinished(): boolean {
    return this.finished;
  }

  avanzar(): void {
    if (this.finished) return;

    if (this.index >= this.lines.length - 1) {
      this.finished = true;
      this.onComplete?.();
    } else {
      this.index++;
    }
  }
}
