import RAPIER from '@dimforge/rapier3d-compat';
import { beforeAll, describe, expect, it } from 'vitest';
import { Player } from '../src/entities/Player';

const PHYSICS_DT = 1 / 60;
const NO_INPUT = { moveX: 0, moveZ: 0, jump: false };

function buildTestWorld(): RAPIER.World {
  const world = new RAPIER.World({ x: 0, y: -20, z: 0 });
  const floor = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.25, 0),
  );
  world.createCollider(RAPIER.ColliderDesc.cuboid(10, 0.25, 10), floor);
  return world;
}

function settle(world: RAPIER.World, player: Player, steps: number, input = NO_INPUT, yaw = 0): void {
  for (let i = 0; i < steps; i++) {
    player.step(PHYSICS_DT, input, yaw);
    world.step();
  }
}

beforeAll(async () => {
  await RAPIER.init();
});

describe('Player movement over a flat floor', () => {
  it('falls and settles as grounded resting on the floor', () => {
    const world = buildTestWorld();
    const player = new Player(world, { x: 0, y: 2, z: 0 });

    settle(world, player, 90);

    expect(player.isGrounded).toBe(true);
    expect(player.position.y).toBeGreaterThan(0.8);
    expect(player.position.y).toBeLessThan(1.0);
  });

  it('moves toward -Z when moving forward at yaw 0 (three.js camera looks down -Z)', () => {
    const world = buildTestWorld();
    const player = new Player(world, { x: 0, y: 2, z: 0 });
    settle(world, player, 30); // dejar que aterrice primero

    const startZ = player.position.z;
    settle(world, player, 60, { moveX: 0, moveZ: 1, jump: false }, 0);

    expect(player.position.z).toBeLessThan(startZ);
    expect(Math.abs(player.position.x)).toBeLessThan(0.01);
  });

  it('strafes toward +X when moving right at yaw 0', () => {
    const world = buildTestWorld();
    const player = new Player(world, { x: 0, y: 2, z: 0 });
    settle(world, player, 30);

    const startX = player.position.x;
    settle(world, player, 60, { moveX: 1, moveZ: 0, jump: false }, 0);

    expect(player.position.x).toBeGreaterThan(startX);
  });

  it('gains height immediately after jumping while grounded', () => {
    const world = buildTestWorld();
    const player = new Player(world, { x: 0, y: 2, z: 0 });
    settle(world, player, 30);

    expect(player.isGrounded).toBe(true);
    const groundedY = player.position.y;

    player.step(PHYSICS_DT, { moveX: 0, moveZ: 0, jump: true }, 0);
    world.step();

    expect(player.position.y).toBeGreaterThan(groundedY);
  });

  it('stops against a wall instead of clipping through it', () => {
    const world = buildTestWorld();
    const wall = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(0, 2, -3),
    );
    world.createCollider(RAPIER.ColliderDesc.cuboid(5, 4, 0.25), wall);

    const player = new Player(world, { x: 0, y: 2, z: 0 });
    settle(world, player, 30);
    settle(world, player, 300, { moveX: 0, moveZ: 1, jump: false }, 0);

    // La cara interior del muro está en z=-2.75; el radio de la cápsula es 0.35.
    expect(player.position.z).toBeGreaterThan(-2.45);
  });
});
