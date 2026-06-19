const sky = document.querySelector("#sky");
const camera = document.querySelector("#camera");
const statusText = document.querySelector("#status");
const fadeOverlay = document.querySelector("#fadeOverlay");
const bgMusic = document.querySelector("#bgMusic");

const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const muteBtn = document.querySelector("#muteBtn");
const volumeSlider = document.querySelector("#volumeSlider");

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
let isChanging = false;

// 180°-Logik
let startAngle = null;

// Audio
let lastVolume = 0.45;

function startBackgroundMusic() {
  bgMusic.volume = lastVolume;
  bgMusic.muted = false;

  const playPromise = bgMusic.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log("Musik gestartet");
      })
      .catch(() => {
        console.log("Autoplay blockiert. Musik startet nach erstem Klick.");

        document.body.addEventListener(
          "click",
          () => {
            bgMusic.play();
          },
          { once: true }
        );

        document.body.addEventListener(
          "touchstart",
          () => {
            bgMusic.play();
          },
          { once: true }
        );
      });
  }
}

function setupAudioControls() {
  volumeSlider.value = lastVolume;
  bgMusic.volume = lastVolume;

  volumeSlider.addEventListener("input", () => {
    const volume = parseFloat(volumeSlider.value);

    bgMusic.volume = volume;

    if (volume === 0) {
      bgMusic.muted = true;
      muteBtn.textContent = "🔇";
    } else {
      bgMusic.muted = false;
      lastVolume = volume;
      muteBtn.textContent = "🔊";
    }
  });

  muteBtn.addEventListener("click", () => {
    if (bgMusic.muted || bgMusic.volume === 0) {
      bgMusic.muted = false;

      if (lastVolume <= 0) {
        lastVolume = 0.45;
      }

      bgMusic.volume = lastVolume;
      volumeSlider.value = lastVolume;
      muteBtn.textContent = "🔊";
    } else {
      lastVolume = bgMusic.volume;
      bgMusic.muted = true;
      volumeSlider.value = 0;
      muteBtn.textContent = "🔇";
    }
  });
}

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

async function preloadPanoramas() {
  setStatus("Lade lokale Panoramen...");

  try {
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

async function changeWorld(direction) {
  if (isChanging) return;
  if (panoramaPool.length === 0) return;

  isChanging = true;

  await fadeToBlack();

  currentIndex += direction;

  if (currentIndex >= panoramaPool.length) {
    currentIndex = 0;
  }

  if (currentIndex < 0) {
    currentIndex = panoramaPool.length - 1;
  }

  const panorama = panoramaPool[currentIndex];

  await loadSkyImage(panorama.url, panorama.label);

  await sleep(150);

  await fadeFromBlack();

  // Nach manuellem Wechsel neue aktuelle Blickrichtung speichern
  startAngle = getCurrentYaw();

  setTimeout(() => {
    isChanging = false;
  }, 500);
}

function nextWorld() {
  changeWorld(1);
}

function previousWorld() {
  changeWorld(-1);
}

function getCurrentYaw() {
  const rotationY = camera.object3D.rotation.y;
  const degrees = THREE.MathUtils.radToDeg(rotationY);
  return ((degrees % 360) + 360) % 360;
}

function angleDifference(a, b) {
  let diff = Math.abs(a - b);
  return Math.min(diff, 360 - diff);
}

function checkRotationLoop() {
  const currentAngle = getCurrentYaw();

  if (startAngle === null) {
    startAngle = currentAngle;
    return;
  }

  const diff = angleDifference(currentAngle, startAngle);

  // Wechsel, wenn du dich ca. 180° von deiner letzten Blickrichtung gedreht hast
  if (diff >= 165 && !isChanging) {
    startAngle = currentAngle;
    nextWorld();
  }
}

prevBtn.addEventListener("click", previousWorld);
nextBtn.addEventListener("click", nextWorld);

preloadPanoramas();
setupAudioControls();
startBackgroundMusic();

setInterval(checkRotationLoop, 200);