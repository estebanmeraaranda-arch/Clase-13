// main.js
const screen1 = document.getElementById("screen1");
const screen2 = document.getElementById("screen2");
const startBtn = document.getElementById("startButton");
const backBtn = document.getElementById("backButton");

startBtn.addEventListener("click", async () => {
  console.log("🎮 Start Game clicked");

  // Cambiar pantallas
  screen1.classList.remove("active");
  screen2.classList.add("active");

  // Esperar para actualizar el DOM antes de cargar el 3D
  await new Promise(res => setTimeout(res, 200));

  // Cargar el módulo de Three.js
  import("./game.js")
    .then(module => module.initGame())
    .catch(err => console.error("❌ Error al cargar game.js:", err));
});

// Botón para volver al menú
backBtn.addEventListener("click", () => {
  console.log("↩️ Volviendo al menú");
  screen2.classList.remove("active");
  screen1.classList.add("active");
});
