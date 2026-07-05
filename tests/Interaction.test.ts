import { describe, expect, it, vi } from 'vitest';
import { InteractionSystem, type Interactable } from '../src/core/Interaction';

function makeItem(overrides: Partial<Interactable> = {}): Interactable {
  return {
    id: 'item',
    position: { x: 0, y: 0, z: -2 },
    range: 3,
    onInteract: vi.fn(),
    ...overrides,
  };
}

const EYE = { x: 0, y: 0, z: 0 };
const FORWARD = { x: 0, y: 0, z: -1 }; // three.js: la cámara mira hacia -Z en reposo

describe('InteractionSystem', () => {
  it('returns null when nothing is registered', () => {
    const system = new InteractionSystem();
    expect(system.findTarget(EYE, FORWARD)).toBeNull();
  });

  it('finds an interactable directly ahead and within range', () => {
    const system = new InteractionSystem();
    const item = makeItem();
    system.register(item);

    expect(system.findTarget(EYE, FORWARD)).toBe(item);
  });

  it('ignores an interactable beyond its own range', () => {
    const system = new InteractionSystem();
    system.register(makeItem({ position: { x: 0, y: 0, z: -10 }, range: 3 }));

    expect(system.findTarget(EYE, FORWARD)).toBeNull();
  });

  it('ignores an interactable outside the view cone (behind the player)', () => {
    const system = new InteractionSystem();
    system.register(makeItem({ position: { x: 0, y: 0, z: 2 } })); // detrás, ya que forward es -Z

    expect(system.findTarget(EYE, FORWARD)).toBeNull();
  });

  it('picks the closest candidate when several are in view and in range', () => {
    const system = new InteractionSystem();
    const far = makeItem({ id: 'far', position: { x: 0, y: 0, z: -2.5 } });
    const near = makeItem({ id: 'near', position: { x: 0, y: 0, z: -1 } });
    system.register(far);
    system.register(near);

    expect(system.findTarget(EYE, FORWARD)).toBe(near);
  });

  it('interact() invokes the target callback exactly once', () => {
    const system = new InteractionSystem();
    const item = makeItem();
    system.register(item);

    system.interact(EYE, FORWARD);

    expect(item.onInteract).toHaveBeenCalledTimes(1);
  });

  it('interact() does nothing when there is no valid target', () => {
    const system = new InteractionSystem();
    const item = makeItem({ position: { x: 0, y: 0, z: 2 } }); // fuera del cono
    system.register(item);

    expect(() => system.interact(EYE, FORWARD)).not.toThrow();
    expect(item.onInteract).not.toHaveBeenCalled();
  });

  it('unregister() removes an item so it can no longer be found', () => {
    const system = new InteractionSystem();
    const item = makeItem();
    system.register(item);
    system.unregister(item.id);

    expect(system.findTarget(EYE, FORWARD)).toBeNull();
  });
});
