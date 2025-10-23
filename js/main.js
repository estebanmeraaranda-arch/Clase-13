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
const menuBtn = document.getElementById("menuBtn"); // nuevo: botón del panel de pausa
const winBtn = document.getElementById("winBtn");
const loseBtn = document.getElementById("loseBtn");

const playAgainWin = document.getElementById("playAgainWin");
const menuWin = document.getElementById("menuWin"); // ahora apunta al botón de screen3
const playAgainLose = document.getElementById("playAgainLose");
const menuLose = document.getElementById("menuLose");

/* ================================
   🎵 Sistema de música (rutas organizadas)
================================== */
const AUDIO_FOLDER = './audio/';
const AUDIO_FILES = {
  screen1: 'Death By Glamour - Toby Fox.mp3',
  screen2: "NOW_S YOUR CHANCE TO BE A - Toby Fox.mp3",
  screen3: 'Hip Shop - Toby Fox.mp3',
  screen4: 'My Castle Town - Toby Fox.mp3'
};

let currentMusic = null;

function playMusic(fileName) {
  stopMusic();
  if (!fileName) return;
  const path = AUDIO_FOLDER + fileName;
  const audio = new Audio(path);
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

  // Limpieza / inicio de juego
  if (id === "screen2") {
    startGame();
  } else {
    if (typeof Game.cleanup === "function") Game.cleanup();
  }

  // Cambiar música usando el mapa
  const audioFile = AUDIO_FILES[id] || null;
  playMusic(audioFile);
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
   ⌨️ Eventos globales (con guards)
================================== */
if (startBtn) startBtn.addEventListener("click", () => setActiveScreen("screen2"));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && screens.screen2 && screens.screen2.classList.contains("active")) {
    if (panelEsc) panelEsc.classList.toggle("active");
  }
});

/* ================================
   🔘 Botones del menú de pausa
================================== */
if (resumeBtn) resumeBtn.addEventListener("click", () => {
  if (panelEsc) panelEsc.classList.remove("active");
});

if (menuBtn) menuBtn.addEventListener("click", () => { // listener para volver al menú desde pausa
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

/* ================================
   🔘 Botones pantalla GANASTE
================================== */
if (playAgainWin) playAgainWin.addEventListener("click", () => setActiveScreen("screen2"));
if (menuWin) menuWin.addEventListener("click", () => setActiveScreen("screen1")); // now works

/* ================================
   🔘 Botones pantalla PERDISTE
================================== */
if (playAgainLose) playAgainLose.addEventListener("click", () => setActiveScreen("screen2"));
if (menuLose) menuLose.addEventListener("click", () => setActiveScreen("screen1"));

/* ================================
   🔔 Inicializar estado / música al cargar
================================== */
try {
  if (screens.screen1 && screens.screen1.classList.contains("active")) {
    const audioFile = AUDIO_FILES.screen1 || null;
    playMusic(audioFile);
  }
} catch (e) {
  console.warn("Error al iniciar música inicial:", e);
}
