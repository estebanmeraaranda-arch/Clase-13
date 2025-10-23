// main.js
const screen1 = document.getElementById("screen1");
const screen2 = document.getElementById("screen2");
const startBtn = document.getElementById("startButton");
const backBtn = document.getElementById("backButton");
const container = document.getElementById("container");

let cleanupFn = null;

startBtn.addEventListener("click", async () => {
  console.log("🎮 Start Game clicked");

  // Cambiar pantallas
  screen1.classList.remove("active");
  screen1.style.display = 'none';
  screen2.style.display = 'block';
  screen2.classList.add("active");

  // Esperar para actualizar el DOM antes de cargar el 3D
  await new Promise(res => setTimeout(res, 200));

  // Import all exports from gamee.js. Ajusta el nombre si usas export default o un nombre distinto.
  import * as Gamee from './gamee.js';

  // call gamee initializer (try named export initSnowBiome, then default, then init)
  try {
    if (typeof Gamee.initSnowBiome === 'function') {
      cleanupFn = await Gamee.initSnowBiome(container);
    } else if (typeof Gamee.default === 'function') {
      cleanupFn = await Gamee.default(container);
    } else if (typeof Gamee.init === 'function') {
      cleanupFn = await Gamee.init(container);
    } else {
      console.error('gamee.js no exporta initSnowBiome/default/init. Adapta gamee.js para exportar una función que reciba container.');
    }
  } catch (err) {
    console.error('Error inicializando gamee:', err);
  }
});

// Botón para volver al menú
backBtn.addEventListener("click", () => {
  console.log("↩️ Volviendo al menú");

  // call cleanup if returned
  try {
    if (typeof cleanupFn === 'function') cleanupFn();
    if (typeof Gamee.disposeScene === 'function') Gamee.disposeScene();
  } catch (err) {
    console.warn('Error during cleanup:', err);
  }

  // switch back
  screen2.classList.remove("active");
  screen2.style.display = 'none';
  screen1.style.display = 'block';
  screen1.classList.add("active");

  container.innerHTML = '';
});
