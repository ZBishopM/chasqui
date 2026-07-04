import RAPIER from '@dimforge/rapier3d-compat';

const CAPSULE_RADIUS = 0.35;
const CAPSULE_HALF_HEIGHT = 0.55;
/** Altura de los ojos medida desde el centro de la cápsula (no desde los pies). */
export const EYE_OFFSET = 0.7;

const MOVE_SPEED = 5;
const JUMP_SPEED = 6;
const GRAVITY = -20;

export interface MoveInput {
  /** -1 (izquierda) a 1 (derecha), relativo a la cámara. */
  moveX: number;
  /** -1 (atrás) a 1 (adelante), relativo a la cámara. */
  moveZ: number;
  jump: boolean;
}

/**
 * Envoltorio del Chasqui sobre un KinematicCharacterController de Rapier.
 * El cuerpo es kinematic-position-based: nosotros calculamos el desplazamiento
 * deseado cuadro a cuadro y Rapier lo corrige contra la geometría del nivel.
 */
export class Player {
  readonly rigidBody: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;
  private verticalVelocity = 0;
  private grounded = false;

  constructor(world: RAPIER.World, spawn: { x: number; y: number; z: number }) {
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      spawn.x,
      spawn.y,
      spawn.z,
    );
    this.rigidBody = world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.capsule(CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS);
    this.collider = world.createCollider(colliderDesc, this.rigidBody);

    this.controller = world.createCharacterController(0.02);
    this.controller.enableAutostep(0.4, 0.2, true);
    this.controller.enableSnapToGround(0.3);
    this.controller.setApplyImpulsesToDynamicBodies(true);
    this.controller.setMaxSlopeClimbAngle((60 * Math.PI) / 180);
    this.controller.setMinSlopeSlideAngle((45 * Math.PI) / 180);
  }

  get isGrounded(): boolean {
    return this.grounded;
  }

  get position(): RAPIER.Vector {
    return this.rigidBody.translation();
  }

  /** Avanza la simulación un paso de física fijo, moviendo al Chasqui según el input y la cámara. */
  step(dt: number, input: MoveInput, cameraYawRad: number): void {
    const sinYaw = Math.sin(cameraYawRad);
    const cosYaw = Math.cos(cameraYawRad);

    // La cámara de three.js mira hacia -Z en reposo.
    const forwardX = -sinYaw;
    const forwardZ = -cosYaw;
    const rightX = cosYaw;
    const rightZ = -sinYaw;

    let dx = input.moveX * rightX + input.moveZ * forwardX;
    let dz = input.moveX * rightZ + input.moveZ * forwardZ;
    const len = Math.hypot(dx, dz);
    if (len > 1e-4) {
      dx = (dx / len) * MOVE_SPEED * dt;
      dz = (dz / len) * MOVE_SPEED * dt;
    } else {
      dx = 0;
      dz = 0;
    }

    if (this.grounded) {
      this.verticalVelocity = input.jump ? JUMP_SPEED : -0.5;
    } else {
      this.verticalVelocity += GRAVITY * dt;
    }
    const dy = this.verticalVelocity * dt;

    this.controller.computeColliderMovement(this.collider, { x: dx, y: dy, z: dz });
    const corrected = this.controller.computedMovement();
    this.grounded = this.controller.computedGrounded();

    const pos = this.rigidBody.translation();
    this.rigidBody.setNextKinematicTranslation({
      x: pos.x + corrected.x,
      y: pos.y + corrected.y,
      z: pos.z + corrected.z,
    });
  }
}
