// main.js
import * as Game from "./gamee.js";

/* ================================
    Referencias a pantallas y botones
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
   🎵 Rutas y control de audio
   - introMusic: reproducida SOLO una vez al inicio (en el primer gesto)
   - currentMusic: música manejada por setActiveScreen para screens != intro
   - introConsumed: una vez que se sale de screen1, no volver a usar intro
================================== */
const AUDIO_FOLDER = './audio/';
const AUDIO_FILES = {
  screen1: 'Death By Glamour - Toby Fox.mp3', // usado para intro sólo al inicio
  screen2: "NOW_S YOUR CHANCE TO BE A - Toby Fox.mp3",
  screen3: 'Hip Shop - Toby Fox.mp3',
  screen4: 'My Castle Town - Toby Fox.mp3'
};

let introMusic = null;
let introStarted = false;   // si la intro se llegó a iniciar (por gesto)
let introConsumed = false;  // si ya salimos de screen1 y no queremos volver a usar la intro
let currentMusic = null;

/* Reproduce la música normal para cada screen (no la intro) */
function playMusic(fileName) {
  stopMusic();
  if (!fileName) return;
  const audio = new Audio(AUDIO_FOLDER + fileName);
  audio.loop = true;
  audio.volume = 0.6;
  audio.play().catch((err) => console.warn("Audio no pudo reproducirse:", err));
  currentMusic = audio;
}

function stopMusic() {
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
    currentMusic = null;
  }
}

/* Intro: se inicia sólo una vez en el primer gesto del usuario mientras está en screen1 */
function startIntroNow() {
  if (introStarted || introConsumed) return;
  if (!screens.screen1 || !screens.screen1.classList.contains("active")) return;

  introStarted = true;
  introMusic = new Audio(AUDIO_FOLDER + AUDIO_FILES.screen1);
  introMusic.loop = true;
  introMusic.volume = 0.6;
  introMusic.play().catch((err) => console.warn("Intro no pudo reproducirse:", err));
}

/* Detener intro y marcarla como consumida (no usarla otra vez) */
function stopIntroAndConsume() {
  if (introMusic) {
    try {
      introMusic.pause();
      introMusic.currentTime = 0;
    } catch (e) {}
    introMusic = null;
  }
  introConsumed = true;
  introStarted = false;
}

/* ================================
   🧠 Cambiar de pantalla
================================== */
let currentScreen = (screens.screen1 && screens.screen1.classList.contains('active')) ? 'screen1' : null;

function setActiveScreen(id) {
  // ocultar todas
  Object.values(screens).forEach((s) => {
    if (!s) return;
    s.classList.remove("active");
    s.style.display = "none";
  });

  // mostrar target
  const target = screens[id];
  if (target) {
    target.classList.add("active");
    target.style.display = "block";
  }

  if (startBtn) startBtn.style.display = id === "screen1" ? "" : "none";

  // Si salimos de screen1 y existía la intro, detenerla y marcarla consumida
  if (currentScreen === 'screen1' && id !== 'screen1') {
    stopIntroAndConsume();
  }

  // Limpieza / inicio de juego
  if (id === "screen2") {
    startGame();
  } else {
    if (typeof Game.cleanup === "function") Game.cleanup();
  }

  // Música: no forzar la intro desde aquí.
  // Reproducir la música asociada a la screen actual (excepto la intro de inicio)
  if (id === 'screen1') {
    // Si la intro ya fue consumida, NO volver a reproducirla.
    // Si la intro aún no se inició, la reproduciremos mediante el listener de gesto (no aquí).
    if (introConsumed) {
      // opcional: si quieres un music loop distinto para menu después, descomenta:
      // playMusic(AUDIO_FILES.screen1);
    }
  } else {
    // para otras pantallas reproducir su música normal
    const audioFile = AUDIO_FILES[id] || null;
    playMusic(audioFile);
  }

  currentScreen = id;
}

/* ================================
   🕹️ Iniciar / Reiniciar juego
================================== */
function startGame() {
  const container = document.getElementById("container");
  if (container) container.innerHTML = "";
  if (typeof Game.cleanup === "function") Game.cleanup();
  if (typeof Game.initGame === "function") Game.initGame();
}

/* ================================
   ⌨️ Eventos globales y botones
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

if (menuBtn) menuBtn.addEventListener("click", () => {
  if (panelEsc) panelEsc.classList.remove("active");
  setActiveScreen("screen1");
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
   🔔 Iniciar intro en el PRIMER gesto del usuario
   Esto sortea las restricciones de autoplay: escucha el primer click/keydown.
   Si el primer gesto ocurre en screen1, se reproduce la intro y se quitan listeners.
   Si se cambia de screen antes de que el usuario haga gesto, la intro no se iniciará.
================================== */
function bindStartIntroOnFirstGesture() {
  function onFirstGesture(e) {
    console.log('[audio] primer gesto:', e.type, 'currentScreen=', currentScreen, 'introStarted=', introStarted, 'introConsumed=', introConsumed);
    if (currentScreen === 'screen1' && !introConsumed && !introStarted) {
      startIntroNow();
      console.log('[audio] intentando reproducir intro...');
    } else {
      console.log('[audio] no se reproduce intro (no estaba en screen1 o ya consumida).');
    }
    // remover los listeners (solo queremos intentar una vez)
    document.removeEventListener('pointerdown', onFirstGesture, true);
    document.removeEventListener('touchstart', onFirstGesture, true);
    document.removeEventListener('keydown', onFirstGesture, true);
  }

  // usar pointerdown/touchstart/keydown con capture y una sola invocación
  document.addEventListener('pointerdown', onFirstGesture, true);
  document.addEventListener('touchstart', onFirstGesture, true);
  document.addEventListener('keydown', onFirstGesture, true);

  // fallback: si la pestaña gana foco y ya hay interacción previa, intentar también
  function onVisibility() {
    if (document.visibilityState === 'visible') {
      // intentar reproducir si estamos en menu y no se consumió la intro
      if (currentScreen === 'screen1' && !introConsumed && !introStarted) {
        startIntroNow();
      }
    }
  }
  document.addEventListener('visibilitychange', onVisibility);
}

// bindear intento de inicio al cargar
bindStartIntroOnFirstGesture();

