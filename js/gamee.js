// gamee.js (REEMPLAZAR TODO) 
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let clock;
let scene, camera, renderer, stats;
let worldOctree;
let spheres = [];
let sphereIdx = 0;
let playerCollider;
let playerVelocity, playerDirection;
let playerOnFloor = false;
let mouseTime = 0;
let keyStates = {};
let animationRunning = false;
let animationFrameId = null;
let loader;
let gui, helper;
let containerElement;

// constants
const GRAVITY = 30;
const NUM_SPHERES = 100;
const SPHERE_RADIUS = 0.2;
const STEPS_PER_FRAME = 5;

const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

/**
 * initGame - inicializa todo desde cero y pone la animación en marcha.
 * Llamar cada vez que entres a screen2.
 */
export function initGame() {
  // si ya está corriendo, limpiamos antes (asegura reinicio limpio)
  if (animationRunning) {
    cleanup();
  }

  // preparar contenedor (se asume que existe en DOM)
  containerElement = document.getElementById('container');
  if (!containerElement) {
    console.error('gamee.js: no se encontró #container');
    return;
  }

  // clock
  clock = new THREE.Clock();

  // escena y niebla
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x88ccee);
  scene.fog = new THREE.Fog(0x88ccee, 0, 50);

  // cámara
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.rotation.order = 'YXZ';

  // luces
  const fillLight1 = new THREE.HemisphereLight(0x8dc1de, 0x00668d, 1.5);
  fillLight1.position.set(2, 1, 1);
  scene.add(fillLight1);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
  directionalLight.position.set(-5, 25, -1);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.near = 0.01;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.radius = 4;
  directionalLight.shadow.bias = -0.00006;
  scene.add(directionalLight);

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  containerElement.appendChild(renderer.domElement);

  // stats
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  containerElement.appendChild(stats.domElement);

  // octree & physics-ish helpers
  worldOctree = new Octree();

  // spheres pool
  const sphereGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 5);
  const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xdede8d });

  spheres = [];
  sphereIdx = 0;

  for (let i = 0; i < NUM_SPHERES; i++) {
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);
    spheres.push({
      mesh: sphere,
      collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), SPHERE_RADIUS),
      velocity: new THREE.Vector3()
    });
  }

  // player collider + physics vars
  playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);
  playerVelocity = new THREE.Vector3();
  playerDirection = new THREE.Vector3();

  playerOnFloor = false;
  mouseTime = 0;
  keyStates = {};

  // loader
  loader = new GLTFLoader().setPath('./models/gltf/');
  loader.load('biomanieveglb.glb', (gltf) => {
    scene.add(gltf.scene);
    worldOctree.fromGraphNode(gltf.scene);

    gltf.scene.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material.map) child.material.map.anisotropy = 4;
      }
    });

    helper = new OctreeHelper(worldOctree);
    helper.visible = false;
    scene.add(helper);

    gui = new GUI({ width: 200 });
    gui.add({ debug: false }, 'debug')
      .onChange(function (value) {
        helper.visible = value;
      });
  }, undefined, (err) => {
    console.warn('GLTF load error:', err);
  });

  // event listeners (guardados para removerlos en cleanup)
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  containerElement.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mouseup', onMouseUp);
  document.body.addEventListener('mousemove', onMouseMove);

  // start animation loop
  animationRunning = true;
  renderer.setAnimationLoop(animate);
}

/**
 * animate - función de animación principal (no exportada)
 */
function animate() {
  if (!animationRunning) return;
  const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    controlsTick(deltaTime);
    updatePlayer(deltaTime);
    updateSpheres(deltaTime);
    teleportPlayerIfOob();
  }

  renderer.render(scene, camera);
  stats && stats.update();
}

/* ============================
   Funciones auxiliares (mismo contenido que antes)
   - onWindowResize, input handlers, physics functions...
   Reescribo / adapto para que trabajen con las variables locales
   ============================ */

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
  keyStates[event.code] = true;
}

function onKeyUp(event) {
  keyStates[event.code] = false;
}

function onMouseDown() {
  if (!containerElement) return;
  document.body.requestPointerLock();
  mouseTime = performance.now();
}

function onMouseUp() {
  if (document.pointerLockElement !== document.body) {
    // si no hay pointerlock, lanzar pelota
    try { throwBall(); } catch (e) { /* ignore */ }
  } else {
    // si si esta, en tu flujo original el throw se hace en mouse up cuando NO hay pointerLock
  }
}

function onMouseMove(event) {
  if (document.pointerLockElement === document.body) {
    camera.rotation.y -= event.movementX / 500;
    camera.rotation.x -= event.movementY / 500;
  }
}

function throwBall() {
  const sphere = spheres[sphereIdx];
  camera.getWorldDirection(playerDirection);
  sphere.collider.center.copy(playerCollider.end).addScaledVector(playerDirection, playerCollider.radius * 1.5);
  const impulse = 15 + 30 * (1 - Math.exp((mouseTime - performance.now()) * 0.001));
  sphere.velocity.copy(playerDirection).multiplyScalar(impulse);
  sphere.velocity.addScaledVector(playerVelocity, 2);
  sphereIdx = (sphereIdx + 1) % spheres.length;
}

function playerCollisions() {
  const result = worldOctree.capsuleIntersect(playerCollider);
  playerOnFloor = false;
  if (result) {
    playerOnFloor = result.normal.y > 0;
    if (!playerOnFloor) playerVelocity.addScaledVector(result.normal, - result.normal.dot(playerVelocity));
    if (result.depth >= 1e-10) playerCollider.translate(result.normal.multiplyScalar(result.depth));
  }
}

function updatePlayer(deltaTime) {
  let damping = Math.exp(-4 * deltaTime) - 1;
  if (!playerOnFloor) {
    playerVelocity.y -= GRAVITY * deltaTime;
    damping *= 0.1;
  }
  playerVelocity.addScaledVector(playerVelocity, damping);
  const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
  playerCollider.translate(deltaPosition);
  playerCollisions();
  camera.position.copy(playerCollider.end);
}

function playerSphereCollision(sphere) {
  const center = vector1.addVectors(playerCollider.start, playerCollider.end).multiplyScalar(0.5);
  const sphere_center = sphere.collider.center;
  const r = playerCollider.radius + sphere.collider.radius;
  const r2 = r * r;
  for (const point of [playerCollider.start, playerCollider.end, center]) {
    const d2 = point.distanceToSquared(sphere_center);
    if (d2 < r2) {
      const normal = vector1.subVectors(point, sphere_center).normalize();
      const v1 = vector2.copy(normal).multiplyScalar(normal.dot(playerVelocity));
      const v2 = vector3.copy(normal).multiplyScalar(normal.dot(sphere.velocity));
      playerVelocity.add(v2).sub(v1);
      sphere.velocity.add(v1).sub(v2);
      const d = (r - Math.sqrt(d2)) / 2;
      sphere_center.addScaledVector(normal, -d);
    }
  }
}

function spheresCollisions() {
  for (let i = 0, length = spheres.length; i < length; i++) {
    const s1 = spheres[i];
    for (let j = i + 1; j < length; j++) {
      const s2 = spheres[j];
      const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
      const r = s1.collider.radius + s2.collider.radius;
      const r2 = r * r;
      if (d2 < r2) {
        const normal = vector1.subVectors(s1.collider.center, s2.collider.center).normalize();
        const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
        const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));
        s1.velocity.add(v2).sub(v1);
        s2.velocity.add(v1).sub(v2);
        const d = (r - Math.sqrt(d2)) / 2;
        s1.collider.center.addScaledVector(normal, d);
        s2.collider.center.addScaledVector(normal, -d);
      }
    }
  }
}

function updateSpheres(deltaTime) {
  spheres.forEach(sphere => {
    sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);
    const result = worldOctree.sphereIntersect(sphere.collider);
    if (result) {
      sphere.velocity.addScaledVector(result.normal, - result.normal.dot(sphere.velocity) * 1.5);
      sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
    } else {
      sphere.velocity.y -= GRAVITY * deltaTime;
    }
    const damping = Math.exp(- 1.5 * deltaTime) - 1;
    sphere.velocity.addScaledVector(sphere.velocity, damping);
    playerSphereCollision(sphere);
  });
  spheresCollisions();
  for (const sphere of spheres) {
    sphere.mesh.position.copy(sphere.collider.center);
  }
}

function getForwardVector() {
  camera.getWorldDirection(playerDirection);
  playerDirection.y = 0;
  playerDirection.normalize();
  return playerDirection;
}

function getSideVector() {
  camera.getWorldDirection(playerDirection);
  playerDirection.y = 0;
  playerDirection.normalize();
  playerDirection.cross(camera.up);
  return playerDirection;
}

function controlsTick(deltaTime) {
  const speedDelta = deltaTime * (playerOnFloor ? 25 : 8);
  if (keyStates['KeyW']) playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));
  if (keyStates['KeyS']) playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta));
  if (keyStates['KeyA']) playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));
  if (keyStates['KeyD']) playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
  if (playerOnFloor && keyStates['Space']) playerVelocity.y = 15;
}

function teleportPlayerIfOob() {
  if (camera.position.y <= -25) {
    playerCollider.start.set(0, 0.35, 0);
    playerCollider.end.set(0, 1, 0);
    playerCollider.radius = 0.35;
    camera.position.copy(playerCollider.end);
    camera.rotation.set(0, 0, 0);
  }
}

/**
 * cleanup - detiene la animación, remueve canvas y listeners y libera recursos
 */
export function cleanup() {
  // stop animation loop
  try {
    animationRunning = false;
    if (renderer) {
      renderer.setAnimationLoop(null);
    }
  } catch (e) {
    console.warn('cleanup: error stopping animation loop', e);
  }

  // remove three.js canvas
  try {
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    if (stats && stats.domElement && stats.domElement.parentNode) {
      stats.domElement.parentNode.removeChild(stats.domElement);
    }
  } catch (e) {
    console.warn('cleanup: error removing dom elements', e);
  }

  // dispose renderer & geometries/materials if possible
  try {
    if (renderer) {
      renderer.dispose && renderer.dispose();
    }
  } catch (e) {
    console.warn('cleanup: error disposing renderer', e);
  }

  // remove GUI and helper
  try {
    if (gui) {
      gui.destroy && gui.destroy();
      gui = null;
    }
    if (helper && helper.parent) {
      helper.parent.remove(helper);
      helper = null;
    }
  } catch (e) {
    console.warn('cleanup: error removing gui/helper', e);
  }

  // remove event listeners
  try {
    window.removeEventListener('resize', onWindowResize);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    if (containerElement) {
      containerElement.removeEventListener('mousedown', onMouseDown);
    }
    document.removeEventListener('mouseup', onMouseUp);
    document.body.removeEventListener('mousemove', onMouseMove);
  } catch (e) {
    console.warn('cleanup: error removing listeners', e);
  }

  // reset references
  clock = null;
  scene = null;
  camera = null;
  renderer = null;
  stats = null;
  worldOctree = null;
  spheres = [];
  sphereIdx = 0;
  playerCollider = null;
  playerVelocity = null;
  playerDirection = null;
  keyStates = {};
  loader = null;
  containerElement = null;
  animationFrameId = null;
  animationRunning = false;
}
