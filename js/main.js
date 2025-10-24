// main.js
import * as Game from "./gamee.js";

/* ================================
   🔹 Referencias a pantallas y botones
================================== */
const screens = {
  screen1: document.getElementById("screen1"),
  screen2: document.getElementById("screen2"),
  screen3: document.getElementById("screen3"),
  screen4: document.getElementById("screen4"),
};

const startBtn = document.getElementById("startButton");
const panelEsc = document.getElementById("panelEsc");

const resumeBtn = document.getElementById("resumeBtn");
const winBtn = document.getElementById("winBtn");
const loseBtn = document.getElementById("loseBtn");

const playAgainWin = document.getElementById("playAgainWin");
const menuWin = document.getElementById("menuWin");
const playAgainLose = document.getElementById("playAgainLose");
const menuLose = document.getElementById("menuLose");

/* ================================
   🎵 Configuración de audio
================================== */
const AUDIO_FOLDER = "./audio/";
const AUDIO_FILES = {
  screen1: "Death By Glamour - Toby Fox.mp3",
  screen2: "NOW_S YOUR CHANCE TO BE A - Toby Fox.mp3",
  screen3: "Hip Shop - Toby Fox.mp3",
  screen4: "My Castle Town - Toby Fox.mp3",
};

let audioCtx = null;
let gainNode = null;
let currentMusic = null;
let currentScreen = "screen1";

/* Inicializa el sistema de audio */
async function initAudioSystem() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.6;
  gainNode.connect(audioCtx.destination);
}

/* Carga y reproduce una pista */
async function playMusic(screenName) {
  stopMusic();
  const file = AUDIO_FILES[screenName];
  if (!file || !audioCtx) return;

  try {
    const response = await fetch(AUDIO_FOLDER + file);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;
    source.connect(gainNode);
    source.start(0);
    currentMusic = source;
    console.log(`[Audio] Reproduciendo: ${file}`);
  } catch (e) {
    console.warn("[Audio] Error al reproducir:", e);
  }
}

/* Detiene la pista actual */
function stopMusic() {
  if (currentMusic) {
    try {
      currentMusic.stop();
    } catch {}
    currentMusic = null;
  }
}

/* ================================
   ⚡ Intentar autoplay al iniciar
================================== */
async function tryAutoStartAudio() {
  try {
    await initAudioSystem();
    await audioCtx.resume();
    gainNode.gain.value = 0;
    await playMusic("screen1");
    gainNode.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 1);
    console.log("[Audio] Autoplay permitido, música de Screen 1 iniciada automáticamente.");
  } catch (err) {
    console.warn("[Audio] Autoplay bloqueado, esperando interacción del usuario...");
    document.addEventListener("pointerdown", unlockAndStartAudio, { once: true, capture: true });
    document.addEventListener("keydown", unlockAndStartAudio, { once: true, capture: true });
    document.addEventListener("touchstart", unlockAndStartAudio, { once: true, capture: true });
  }
}

/* Si autoplay falla, se inicia tras el primer gesto */
async function unlockAndStartAudio() {
  await initAudioSystem();
  await audioCtx.resume();
  await playMusic("screen1");
  console.log("[Audio] Reproducción iniciada tras interacción.");
}

/* ================================
   🧠 Control de pantallas
================================== */
function setActiveScreen(id) {
  // Ocultar todas
  Object.values(screens).forEach((s) => {
    if (s) {
      s.classList.remove("active");
      s.style.display = "none";
    }
  });

  // Mostrar la deseada
  const target = screens[id];
  if (target) {
    target.classList.add("active");
    target.style.display = "block";
  }

  // Mostrar u ocultar botón Start
  if (startBtn) startBtn.style.display = id === "screen1" ? "" : "none";

  // Detener música actual y reproducir la del nuevo screen
  stopMusic();
  playMusic(id);

  // Inicializar juego si es la screen 2
  if (id === "screen2") {
    const container = document.getElementById("container");
    if (container) container.innerHTML = "";
    if (typeof Game.cleanup === "function") Game.cleanup();
    if (typeof Game.initGame === "function") Game.initGame();
  } else {
    if (typeof Game.cleanup === "function") Game.cleanup();
  }

  currentScreen = id;
}

/* ================================
   ⌨️ Eventos de botones
================================== */
if (startBtn) startBtn.addEventListener("click", () => setActiveScreen("screen2"));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && screens.screen2 && screens.screen2.classList.contains("active")) {
    if (panelEsc) panelEsc.classList.toggle("active");
  }
});

if (resumeBtn) resumeBtn.addEventListener("click", () => {
  if (panelEsc) panelEsc.classList.remove("active");
});

if (winBtn) winBtn.addEventListener("click", () => {
  if (panelEsc) panelEsc.classList.remove("active");
  setActiveScreen("screen3");
});

if (loseBtn) loseBtn.addEventListener("click", () => {
  if (panelEsc) panelEsc.classList.remove("active");
  setActiveScreen("screen4");
});

if (playAgainWin) playAgainWin.addEventListener("click", () => setActiveScreen("screen2"));
if (menuWin) menuWin.addEventListener("click", () => setActiveScreen("screen1"));

if (playAgainLose) playAgainLose.addEventListener("click", () => setActiveScreen("screen2"));
if (menuLose) menuLose.addEventListener("click", () => setActiveScreen("screen1"));

/* ================================
   🚀 Ejecutar al cargar
================================== */
window.addEventListener("load", tryAutoStartAudio);
