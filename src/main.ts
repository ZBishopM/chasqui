import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { Player, EYE_OFFSET, type MoveInput } from './entities/Player';

const PHYSICS_DT = 1 / 60;
const MAX_STEPS_PER_FRAME = 5;

async function main(): Promise<void> {
  await RAPIER.init();

  const app = document.getElementById('app')!;
  const hint = document.getElementById('hint')!;

  // --- Three.js: escena, cámara, renderer ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fb6d9);
  scene.fog = new THREE.Fog(0x8fb6d9, 20, 60);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    200,
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  app.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  scene.add(hemiLight);
  const sunLight = new THREE.DirectionalLight(0xfff2d5, 1.5);
  sunLight.position.set(15, 25, 10);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // --- Rapier: mundo de física ---
  const world = new RAPIER.World({ x: 0, y: -20, z: 0 });

  function addGreyboxSolid(
    size: THREE.Vector3Tuple,
    position: THREE.Vector3Tuple,
    color: number,
  ): THREE.Mesh {
    const [sx, sy, sz] = size;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      new THREE.MeshStandardMaterial({ color }),
    );
    mesh.position.set(...position);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);

    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(...position);
    const body = world.createRigidBody(bodyDesc);
    world.createCollider(RAPIER.ColliderDesc.cuboid(sx / 2, sy / 2, sz / 2), body);
    return mesh;
  }

  // Sala de prueba: piso, muros perimetrales y dos obstáculos (escalón bajo y plataforma alta).
  addGreyboxSolid([24, 0.5, 24], [0, -0.25, 0], 0x9a9a9a);
  addGreyboxSolid([24, 4, 0.5], [0, 2, -12], 0xbdbdbd);
  addGreyboxSolid([24, 4, 0.5], [0, 2, 12], 0xbdbdbd);
  addGreyboxSolid([0.5, 4, 24], [-12, 2, 0], 0xbdbdbd);
  addGreyboxSolid([0.5, 4, 24], [12, 2, 0], 0xbdbdbd);
  addGreyboxSolid([2, 0.3, 2], [3, 0.15, 3], 0xd8c27a); // escalón bajo (autostep)
  addGreyboxSolid([3, 1.2, 3], [-4, 0.6, -4], 0xd8c27a); // plataforma alta (requiere salto)

  // --- Jugador ---
  const player = new Player(world, { x: 0, y: 2, z: 5 });
  camera.position.set(0, EYE_OFFSET, 5);

  const controls = new PointerLockControls(camera, renderer.domElement);
  renderer.domElement.addEventListener('click', () => controls.lock());
  controls.addEventListener('lock', () => (hint.style.opacity = '0'));
  controls.addEventListener('unlock', () => (hint.style.opacity = '0.7'));

  // --- Input ---
  const keys = new Set<string>();
  window.addEventListener('keydown', (e) => keys.add(e.code));
  window.addEventListener('keyup', (e) => keys.delete(e.code));

  function readInput(): MoveInput {
    const moveZ = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
    const moveX = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
    return { moveX, moveZ, jump: keys.has('Space') };
  }

  // --- Raycast de interacción: base compartida por casi todos los poderes del GDD ---
  const raycaster = new THREE.Raycaster();
  const lookDir = new THREE.Vector3();
  let hoveredType: string | null = null;

  function updateInteractionRaycast(): void {
    raycaster.set(camera.position, camera.getWorldDirection(lookDir));
    const hits = raycaster.intersectObjects(scene.children, false);
    const type = hits[0]?.object.type ?? null;
    if (type !== hoveredType) {
      hoveredType = type;
      console.debug('[interact] mirando:', type ?? 'nada');
    }
  }

  // --- Loop principal: física a paso fijo, render a la tasa del monitor ---
  const timer = new THREE.Timer();
  timer.connect(document);
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  let accumulator = 0;

  renderer.setAnimationLoop((timestamp) => {
    timer.update(timestamp);
    const frameDelta = Math.min(timer.getDelta(), 0.1);
    accumulator += frameDelta;

    const input = readInput();
    euler.setFromQuaternion(camera.quaternion, 'YXZ');
    const yaw = euler.y;

    let steps = 0;
    while (accumulator >= PHYSICS_DT && steps < MAX_STEPS_PER_FRAME) {
      player.step(PHYSICS_DT, input, yaw);
      world.step();
      accumulator -= PHYSICS_DT;
      steps++;
    }

    const pos = player.position;
    camera.position.set(pos.x, pos.y + EYE_OFFSET, pos.z);

    updateInteractionRaycast();
    renderer.render(scene, camera);
  });

  // Gancho de depuración: solo para inspeccionar estado en vivo durante el desarrollo.
  (window as unknown as { __debug: unknown }).__debug = { scene, camera, player, controls, world };
}

main().catch((err) => {
  console.error('Fallo al iniciar Chasqui:', err);
});
