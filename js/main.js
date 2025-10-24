// main.js
import * as Game from "./gamee.js";

/* ================================
   🔹 Pantallas y botones
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
const menuBtn = document.getElementById("menuBtn");
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

let audioCtx;
let gainNode;
let currentSource = null;
let audioBuffers = {};
let audioReady = false;
let currentScreen = "screen1";

/* ================================
   🔊 Inicializar sistema de audio
================================== */
async function initAudioSystem() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.7;
  gainNode.connect(audioCtx.destination);
}

/* ================================
   🎧 Precargar y reproducir música
================================== */
async function loadBuffer(key) {
  if (audioBuffers[key]) return audioBuffers[key];
  const response = await fetch(AUDIO_FOLDER + AUDIO_FILES[key]);
  const data = await response.arrayBuffer();
  const buffer = await audioCtx.decodeAudioData(data);
  audioBuffers[key] = buffer;
  return buffer;
}

async function playMusic(screenKey) {
  if (!audioCtx || audioCtx.state !== "running") return;
  stopMusic();

  const buffer = await loadBuffer(screenKey);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(gainNode);
  source.start(0);
  currentSource = source;
  console.log(`[🎶] Reproduciendo: ${screenKey}`);
}

function stopMusic() {
  if (currentSource) {
    try {
      currentSource.stop(0);
      currentSource.disconnect();
    } catch {}
    currentSource = null;
  }
}

/* ================================
   🧠 Cambiar de pantalla
================================== */
async function setActiveScreen(id) {
  Object.values(screens).forEach((s) => {
    if (s) {
      s.classList.remove("active");
      s.style.display = "none";
    }
  });

  const target = screens[id];
  if (target) {
    target.classList.add("active");
    target.style.display = "block";
  }

  if (startBtn) startBtn.style.display = id === "screen1" ? "" : "none";

  // Cambiar música
  if (audioReady && audioCtx.state === "running") {
    await playMusic(id);
  }

  // Control del juego
  if (id === "screen2") {
    const container = document.getElementById("container");
    if (container) container.innerHTML = "";
    Game.cleanup?.();
    Game.initGame?.();
  } else {
    Game.cleanup?.();
  }

  currentScreen = id;
}

/* ================================
   ⌨️ Eventos globales
================================== */
function handleStartGame() {
  console.log("[Start] Intentando iniciar juego...");
  
  // Si el audio no está listo, intentar desbloquearlo primero
  if (!audioReady) {
    console.log("[Start] Audio no listo - intentando desbloquear...");
    unlockAudioAndStart().then(() => {
      console.log("[Start] Audio desbloqueado - cambiando a screen2");
      setActiveScreen("screen2");
    });
    return;
  }

  // Si el audio está listo, cambiar directamente
  console.log("[Start] Audio listo - cambiando a screen2");
  setActiveScreen("screen2");
}

// Remover el listener anterior y agregar el nuevo
if (startBtn) {
  startBtn.removeEventListener("click", handleStartGame); // Limpiar posibles duplicados
  startBtn.addEventListener("click", handleStartGame);
}

// El resto de los event listeners se mantienen igual
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && screens.screen2?.classList.contains("active")) {
    panelEsc?.classList.toggle("active");
  }
});

resumeBtn?.addEventListener("click", () => panelEsc?.classList.remove("active"));
menuBtn?.addEventListener("click", () => {
  panelEsc?.classList.remove("active");
  setActiveScreen("screen1");
});
winBtn?.addEventListener("click", () => {
  panelEsc?.classList.remove("active");
  setActiveScreen("screen3");
});
loseBtn?.addEventListener("click", () => {
  panelEsc?.classList.remove("active");
  setActiveScreen("screen4");
});

playAgainWin?.addEventListener("click", () => setActiveScreen("screen2"));
menuWin?.addEventListener("click", () => setActiveScreen("screen1"));
playAgainLose?.addEventListener("click", () => setActiveScreen("screen2"));
menuLose?.addEventListener("click", () => setActiveScreen("screen1"));

/* ================================
   ⚡ Desbloquear y preparar audio
================================== */
async function unlockAudioAndStart() {
  try {
    await initAudioSystem();
    await audioCtx.resume();
    audioReady = true;
    await playMusic(currentScreen);
    console.log("[Audio] Sistema desbloqueado y música actual reproducida.");
  } catch (error) {
    console.error("[Audio] Error al desbloquear:", error);
  }
}

/* ================================
   🚀 Al cargar la página
================================== */
window.addEventListener("load", async () => {
  try {
    await initAudioSystem();
    await audioCtx.resume();
    audioReady = true;
    await playMusic("screen1");
    console.log("[Audio] Autoplay exitoso.");
  } catch (e) {
    console.warn("[Audio] Autoplay bloqueado — esperando interacción del usuario.");
    // Solo agregamos el listener una vez y para click
    document.addEventListener("click", unlockAudioAndStart, { once: true });
  }
});
