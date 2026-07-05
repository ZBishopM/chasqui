import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { Player, EYE_OFFSET, type MoveInput } from './entities/Player';
import { InteractionSystem } from './core/Interaction';
import { CamaquenTracker } from './core/Camaquen';
import { Journey } from './core/Journey';
import { Dialogue, type DialogueLine } from './core/Dialogue';

const PHYSICS_DT = 1 / 60;
const MAX_STEPS_PER_FRAME = 5;

async function main(): Promise<void> {
  await RAPIER.init();

  const app = document.getElementById('app')!;
  const hint = document.getElementById('hint')!;
  const camaquenDebug = document.getElementById('camaquen-debug')!;
  const dialogueEl = document.getElementById('dialogue')!;

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
  // Luz cálida del interior de la cabaña, para que el umbral de la puerta se sienta
  // como un salto de un espacio acogedor a la luz abierta del valle (GDD, Acto I).
  const hearthLight = new THREE.PointLight(0xffcc88, 1.4, 9);
  hearthLight.position.set(0, 2, 7);
  scene.add(hearthLight);

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

  // --- Acto I, escena 1: El Hogar ---
  // Valle exterior abierto (piso grande, sin muros perimetrales: es un greybox de
  // desarrollo, no el nivel final de Ayacucho).
  addGreyboxSolid([60, 0.5, 60], [0, -0.25, 0], 0x7f9668);

  // Cabaña: interior de 6x6, muros de 0.3 de espesor, con un vano de puerta de 1.6m
  // en el muro sur (hacia z menor) por donde se sale al valle.
  const wallColor = 0x8a6d4b;
  addGreyboxSolid([6.6, 2.4, 0.3], [0, 1.2, 10], wallColor); // muro norte (fondo)
  addGreyboxSolid([0.3, 2.4, 6.6], [-3, 1.2, 7], wallColor); // muro oeste
  addGreyboxSolid([0.3, 2.4, 6.6], [3, 1.2, 7], wallColor); // muro este
  addGreyboxSolid([2.5, 2.4, 0.3], [-2.05, 1.2, 4], wallColor); // muro sur, segmento izquierdo
  addGreyboxSolid([2.5, 2.4, 0.3], [2.05, 1.2, 4], wallColor); // muro sur, segmento derecho (deja el vano de la puerta al centro)
  addGreyboxSolid([6.6, 0.3, 6.6], [0, 2.55, 7], 0x5a4530); // techo

  // Cuna: tutorial de interacción. No tiene collider físico (mueble decorativo).
  const cuna = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xc9a06a }),
  );
  cuna.position.set(-2, 0.4, 9);
  cuna.castShadow = true;
  scene.add(cuna);

  // Esposa: placeholder geométrico (sin arte todavía), de pie junto a la puerta.
  const esposa = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.3, 1.1, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xaa4433 }),
  );
  esposa.position.set(0.9, 0.95, 5);
  esposa.castShadow = true;
  scene.add(esposa);

  // --- Jugador ---
  const player = new Player(world, { x: -1, y: 2, z: 8.5 });
  camera.position.set(-1, EYE_OFFSET, 8.5);

  const controls = new PointerLockControls(camera, renderer.domElement);
  renderer.domElement.addEventListener('click', () => controls.lock());
  controls.addEventListener('lock', () => (hint.style.opacity = '0'));
  controls.addEventListener('unlock', () => (hint.style.opacity = '0.7'));

  // --- Camaquen y Journey: sistemas del gameplay post-prólogo (departamentos, GDD §6/§11/§13).
  // El Champí todavía no existe en esta escena (Acto I es anterior a su entrega); se
  // mantienen instanciados solo como panel de depuración, sin ningún prop que los alimente aquí.
  const camaquen = new CamaquenTracker();
  const journey = new Journey();

  function renderCamaquenDebug(): void {
    camaquenDebug.textContent =
      `${journey.actual.nombre} (${journey.actual.lugarHistorico}) — fase: ${journey.actual.faseDuelo}\n` +
      `Camaquen — poder: ${camaquen.poder.toFixed(1)}  ` +
      `visibilidad: ${camaquen.visibilidad.toFixed(2)}  ` +
      `marca: ${camaquen.marca}\n` +
      `poderes: ${journey.poderesDesbloqueados.join(', ') || '(ninguno)'}\n` +
      `[N] siguiente departamento (debug)`;
  }
  renderCamaquenDebug();

  // --- Diálogo ---
  let activeDialogue: Dialogue | null = null;

  function renderDialogue(): void {
    const line = activeDialogue?.actual;
    if (!line) {
      dialogueEl.style.display = 'none';
      dialogueEl.textContent = '';
      return;
    }
    dialogueEl.style.display = 'block';
    dialogueEl.textContent = `${line.hablante}: ${line.texto}`;
  }

  function startDialogue(lines: readonly DialogueLine[], onComplete?: () => void): void {
    activeDialogue = new Dialogue(lines, () => {
      activeDialogue = null;
      renderDialogue();
      onComplete?.();
    });
    renderDialogue();
  }

  // --- Estado del prólogo ---
  let tieneQuipu = false;

  // --- Sistema de interacción ---
  const interactions = new InteractionSystem();
  interactions.register({
    id: 'cuna',
    position: { x: cuna.position.x, y: cuna.position.y, z: cuna.position.z },
    range: 2,
    onInteract: () => {
      startDialogue([{ hablante: 'Chasqui', texto: 'Duerme tranquilo. Pronto tendrás historias que contarte.' }]);
    },
  });
  interactions.register({
    id: 'esposa',
    position: { x: esposa.position.x, y: esposa.position.y, z: esposa.position.z },
    range: 2.2,
    onInteract: () => {
      if (!tieneQuipu) {
        startDialogue(
          [
            { hablante: 'Esposa', texto: 'Hay rumores de guerra en el camino, otra vez.' },
            { hablante: 'Esposa', texto: 'Prométeme que volverás antes de que anochezca.' },
            { hablante: 'Esposa', texto: 'Lleva este quipu al Curaca. Tus piernas nunca han fallado.' },
          ],
          () => {
            tieneQuipu = true;
            console.info('[acto1] Recibiste el quipu para el Curaca.');
          },
        );
      } else {
        startDialogue([{ hablante: 'Esposa', texto: 'Ten cuidado allá afuera.' }]);
      }
    },
  });
  const lookDir = new THREE.Vector3();

  // --- Input ---
  const keys = new Set<string>();
  window.addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (e.code === 'KeyE') {
      if (activeDialogue && !activeDialogue.isFinished) {
        activeDialogue.avanzar();
        renderDialogue();
      } else {
        interactions.interact(camera.position, camera.getWorldDirection(lookDir));
      }
    }
    if (e.code === 'KeyN') {
      // Atajo de debug: aún no hay un trigger real de fin de nivel/departamento.
      journey.avanzar();
      renderCamaquenDebug();
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));

  function readInput(): MoveInput {
    if (activeDialogue && !activeDialogue.isFinished) {
      return { moveX: 0, moveZ: 0, jump: false }; // el Chasqui no camina mientras conversa
    }
    const moveZ = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
    const moveX = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
    return { moveX, moveZ, jump: keys.has('Space') };
  }

  // --- Loop principal: física a paso fijo, render a la tasa del monitor ---
  // Nota: deliberadamente NO se usa timer.connect(document). Ese modo pone el delta
  // en 0 mientras document.hidden es true, redundante con el clamp manual de abajo
  // (frameDelta acotado a 0.1s), que ya evita el salto grande al recuperar foco.
  const timer = new THREE.Timer();
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

    renderer.render(scene, camera);
  });

  // Gancho de depuración: solo para inspeccionar estado en vivo durante el desarrollo.
  (window as unknown as { __debug: unknown }).__debug = {
    scene,
    camera,
    player,
    controls,
    world,
    interactions,
    camaquen,
    journey,
    getTieneQuipu: () => tieneQuipu,
  };
}

main().catch((err) => {
  console.error('Fallo al iniciar Chasqui:', err);
});
