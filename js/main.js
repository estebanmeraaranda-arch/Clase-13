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
const menuBtn = document.getElementById("menuBtn");
const winBtn = document.getElementById("winBtn");
const loseBtn = document.getElementById("loseBtn");

const playAgainWin = document.getElementById("playAgainWin");
const menuWin = document.getElementById("menuWin");
const playAgainLose = document.getElementById("playAgainLose");
const menuLose = document.getElementById("menuLose");

/* ================================
   🎵 Audio global
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
let currentSource = null;
let audioBuffers = {};
let currentScreen = "screen1";
let audioReady = false; // ✅ indica si ya se desbloqueó y precargó el audio

/* ================================
   🧩 Inicializar sistema de audio
================================== */
async function initAudioSystem() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.6;
    gainNode.connect(audioCtx.destination);
  }

  // Precargar audio solo una vez
  const promises = Object.entries(AUDIO_FILES).map(async ([key, file]) => {
    if (!audioBuffers[key]) {
      const resp = await fetch(AUDIO_FOLDER + file);
      const data = await resp.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(data);
      audioBuffers[key] = buffer;
    }
  });
  await Promise.all(promises);
  audioReady = true;
}

/* ================================
   🎧 Reproducir canción
================================== */
function playMusic(screenKey) {
  stopMusic();
  const buffer = audioBuffers[screenKey];
  if (!buffer || !audioCtx) return;

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(gainNode);
  source.start(0);
  currentSource = source;
}

/* ================================
   🔇 Detener música actual
================================== */
function stopMusic() {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {}
    currentSource.disconnect();
    currentSource = null;
  }
}

/* ================================
   🧠 Cambiar de pantalla
================================== */
function setActiveScreen(id) {
  Object.values(screens).forEach((s) => {
    if (!s) return;
    s.classList.remove("active");
    s.style.display = "none";
  });

  const target = screens[id];
  if (target) {
    target.classList.add("active");
    target.style.display = "block";
  }

  if (startBtn) startBtn.style.display = id === "screen1" ? "" : "none";

  if (id === "screen2") {
    startGame();
  } else {
    Game.cleanup?.();
  }

  // Cambiar música solo si el audio ya está listo y desbloqueado
  if (audioReady && audioCtx && audioCtx.state === "running") {
    playMusic(id);
  }

  currentScreen = id;
}

/* ================================
   🕹️ Iniciar / Reiniciar juego
================================== */
function startGame() {
  const container = document.getElementById("container");
  if (container) container.innerHTML = "";
  Game.cleanup?.();
  Game.initGame?.();
}

/* ================================
   ⌨️ Eventos globales y botones
================================== */
startBtn?.addEventListener("click", () => {
  // Esperar a que el audio esté listo para evitar solapamientos
  if (!audioReady) {
    console.warn("[Audio] No listo aún, esperando...");
    return;
  }
  stopMusic(); // detener la música del menú ANTES de pasar al juego
  setActiveScreen("screen2");
});

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
   ⚡ Desbloquear audio en el primer gesto
================================== */
async function unlockAndStartAudio() {
  if (!audioCtx) {
    await initAudioSystem();
  }

  await audioCtx.resume();
  playMusic("screen1");
  console.log("[Audio] 🎶 Reproduciendo música de Screen 1");

  // quitar listeners una vez desbloqueado
  document.removeEventListener("pointerdown", unlockAndStartAudio, true);
  document.removeEventListener("keydown", unlockAndStartAudio, true);
  document.removeEventListener("touchstart", unlockAndStartAudio, true);
}

// Esperar primer interacción del usuario
document.addEventListener("pointerdown", unlockAndStartAudio, true);
document.addEventListener("keydown", unlockAndStartAudio, true);
document.addEventListener("touchstart", unlockAndStartAudio, true);
