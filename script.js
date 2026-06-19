const sky = document.querySelector("#sky");
const camera = document.querySelector("#camera");
const statusText = document.querySelector("#status");
const fadeOverlay = document.querySelector("#fadeOverlay");

// Lokale Panoramen aus deinem Images-Ordner
let panoramaPool = [
  { label: "Welt 1", url: "Images/1.jpeg" },
  { label: "Welt 2", url: "Images/2.jpeg" },
  { label: "Welt 3", url: "Images/3.jpeg" },
  { label: "Welt 4", url: "Images/4.jpeg" },
  { label: "Welt 5", url: "Images/5.jpeg" },
  { label: "Welt 6", url: "Images/6.jpeg" },
  { label: "Welt 7", url: "Images/7.jpeg" },
  { label: "Welt 8", url: "Images/8.jpeg" }
];

let currentIndex = 0;
let lastSide = null;
let isChanging = false;

function setStatus(text) {
  statusText.textContent = text;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fadeToBlack() {
  fadeOverlay.classList.add("active");
  await sleep(700);
}

async function fadeFromBlack() {
  fadeOverlay.classList.remove("active");
  await sleep(700);
}

function brightenSky() {
  const mesh = sky.getObject3D("mesh");

  if (!mesh || !mesh.material) return;

  mesh.material.color.set("#ffffff");
  mesh.material.toneMapped = false;
  mesh.material.needsUpdate = true;
}

function loadSkyImage(url, label) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      sky.setAttribute("src", url);

      setTimeout(() => {
        brightenSky();
      }, 100);

      setStatus("Aktuelle Welt: " + label);
      resolve();
    };

    img.onerror = () => {
      console.error("Bild konnte nicht geladen werden:", url);
      reject("Bild konnte nicht geladen werden");
    };

    img.src = url;
  });
}

function preloadLocalImages() {
  panoramaPool.forEach((pano) => {
    const img = new Image();
    img.src = pano.url;
  });
}

function shuffleArray(array) {
  array.sort(() => Math.random() - 0.5);
}

async function preloadPanoramas() {
  setStatus("Lade lokale Panoramen...");

  try {
    shuffleArray(panoramaPool);
    currentIndex = 0;

    preloadLocalImages();

    await loadSkyImage(
      panoramaPool[currentIndex].url,
      panoramaPool[currentIndex].label
    );

    setStatus("Bereit: Drehe dich um 180°");
  } catch (error) {
    console.error(error);
    setStatus("Fehler beim Laden der lokalen Bilder");
  }
}

async function nextWorld() {
  if (isChanging) return;
  if (panoramaPool.length === 0) return;

  isChanging = true;

  await fadeToBlack();

  currentIndex++;

  if (currentIndex >= panoramaPool.length) {
    shuffleArray(panoramaPool);
    currentIndex = 0;
  }

  const nextPanorama = panoramaPool[currentIndex];

  await loadSkyImage(nextPanorama.url, nextPanorama.label);

  await sleep(150);

  await fadeFromBlack();

  setTimeout(() => {
    isChanging = false;
  }, 500);
}

function checkRotationLoop() {
  const rotationY = camera.object3D.rotation.y;
  const degrees = THREE.MathUtils.radToDeg(rotationY);
  const normalized = ((degrees % 360) + 360) % 360;

  const currentSide = normalized > 90 && normalized < 270 ? "back" : "front";

  if (lastSide && currentSide !== lastSide) {
    nextWorld();
  }

  lastSide = currentSide;
}

preloadPanoramas();

setInterval(checkRotationLoop, 200);