import { describe, expect, it, vi } from 'vitest';
import { Dialogue } from '../src/core/Dialogue';

describe('Dialogue', () => {
  it('una secuencia vacía empieza terminada, sin línea actual', () => {
    const dialogue = new Dialogue([]);
    expect(dialogue.isFinished).toBe(true);
    expect(dialogue.actual).toBeNull();
  });

  it('expone la primera línea al crearse', () => {
    const dialogue = new Dialogue([{ hablante: 'Esposa', texto: 'Ten cuidado.' }]);
    expect(dialogue.isFinished).toBe(false);
    expect(dialogue.actual).toEqual({ hablante: 'Esposa', texto: 'Ten cuidado.' });
  });

  it('avanzar() recorre las líneas en orden', () => {
    const dialogue = new Dialogue([
      { hablante: 'Esposa', texto: 'Uno.' },
      { hablante: 'Esposa', texto: 'Dos.' },
    ]);

    dialogue.avanzar();

    expect(dialogue.actual?.texto).toBe('Dos.');
    expect(dialogue.isFinished).toBe(false);
  });

  it('avanzar() en la última línea termina el diálogo', () => {
    const dialogue = new Dialogue([{ hablante: 'Esposa', texto: 'Única.' }]);

    dialogue.avanzar();

    expect(dialogue.isFinished).toBe(true);
    expect(dialogue.actual).toBeNull();
  });

  it('avanzar() después de terminado no hace nada (no revive ni lanza error)', () => {
    const dialogue = new Dialogue([{ hablante: 'Esposa', texto: 'Única.' }]);
    dialogue.avanzar();

    expect(() => dialogue.avanzar()).not.toThrow();
    expect(dialogue.isFinished).toBe(true);
  });

  it('llama onComplete exactamente una vez, justo cuando termina', () => {
    const onComplete = vi.fn();
    const dialogue = new Dialogue(
      [
        { hablante: 'Esposa', texto: 'Uno.' },
        { hablante: 'Esposa', texto: 'Dos.' },
      ],
      onComplete,
    );

    dialogue.avanzar();
    expect(onComplete).not.toHaveBeenCalled();

    dialogue.avanzar();
    expect(onComplete).toHaveBeenCalledTimes(1);

    dialogue.avanzar();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
