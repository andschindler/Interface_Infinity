const scene = document.querySelector("a-scene");
const sky = document.querySelector("#sky");
const camera = document.querySelector("#camera");

const statusText = document.querySelector("#status3d");
const fadeOverlay = document.querySelector("#fadeOverlay");
const vrFadeOverlay = document.querySelector("#vrFadeOverlay");

const bgMusic = document.querySelector("#bgMusic");

const prevBtn = document.querySelector("#prevBtn3d");
const nextBtn = document.querySelector("#nextBtn3d");
const muteBtn = document.querySelector("#muteBtn3d");
const muteLabel = document.querySelector("#muteLabel3d");

const volumeLabel = document.querySelector("#volumeLabel3d");
const volumeStepsContainer = document.querySelector("#volumeSteps3d");

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
const VOLUME_STEPS = 10;

// verhindert doppelte Klicks durch Mouse + Gaze Cursor
let lastHudActionTime = 0;

function runHudAction(callback) {
  const now = performance.now();

  if (now - lastHudActionTime < 150) {
    return;
  }

  lastHudActionTime = now;
  tryStartMusicAfterInteraction();
  callback();
}

function setText(entity, text) {
  if (!entity) return;
  entity.setAttribute("value", text);
}

function setStatus(text) {
  setText(statusText, text);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function tryStartMusicAfterInteraction() {
  if (!bgMusic) return;

  bgMusic.play().catch(() => {
    // Browser blockiert Autoplay bis zur Nutzerinteraktion
  });
}

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
        console.log("Autoplay blockiert. Musik startet nach erster Interaktion.");

        document.body.addEventListener("click", tryStartMusicAfterInteraction, {
          once: true
        });

        document.body.addEventListener("touchstart", tryStartMusicAfterInteraction, {
          once: true
        });

        scene.addEventListener("click", tryStartMusicAfterInteraction, {
          once: true
        });
      });
  }
}

function createVolumeSteps() {
  volumeStepsContainer.innerHTML = "";

  for (let i = 0; i < VOLUME_STEPS; i++) {
    const step = document.createElement("a-plane");

    step.setAttribute("class", "clickable volume-step");
    step.setAttribute("width", "0.055");
    step.setAttribute("height", "0.08");
    step.setAttribute("position", `${i * 0.065} 0 0`);
    step.setAttribute("material", "shader: flat; color: #444444");

    const volumeValue = (i + 1) / VOLUME_STEPS;
    step.dataset.volume = volumeValue;

    step.addEventListener("click", () => {
      runHudAction(() => {
        setVolume(volumeValue);
      });
    });

    step.addEventListener("mouseenter", () => {
      step.setAttribute("scale", "1 1.25 1");
    });

    step.addEventListener("mouseleave", () => {
      step.setAttribute("scale", "1 1 1");
    });

    volumeStepsContainer.appendChild(step);
  }
}

function setupAudioControls() {
  bgMusic.volume = lastVolume;
  bgMusic.muted = false;

  createVolumeSteps();
  updateAudioUI();

  muteBtn.addEventListener("click", () => {
    runHudAction(toggleMute);
  });
}

function setVolume(volume) {
  volume = Math.max(0, Math.min(1, volume));

  bgMusic.volume = volume;

  if (volume === 0) {
    bgMusic.muted = true;
  } else {
    bgMusic.muted = false;
    lastVolume = volume;
  }

  updateAudioUI();
}

function toggleMute() {
  if (bgMusic.muted || bgMusic.volume === 0) {
    bgMusic.muted = false;

    if (lastVolume <= 0) {
      lastVolume = 0.45;
    }

    bgMusic.volume = lastVolume;
  } else {
    lastVolume = bgMusic.volume;
    bgMusic.muted = true;
  }

  updateAudioUI();
}

function updateAudioUI() {
  const effectiveVolume = bgMusic.muted ? 0 : bgMusic.volume;
  const percentage = Math.round(effectiveVolume * 100);
  const activeSteps = Math.round(effectiveVolume * VOLUME_STEPS);

  setText(volumeLabel, "VOL " + percentage + "%");
  setText(muteLabel, bgMusic.muted || effectiveVolume === 0 ? "OFF" : "ON");

  const steps = document.querySelectorAll(".volume-step");

  steps.forEach((step, index) => {
    if (index < activeSteps) {
      step.setAttribute("color", "#FFFFFF");
      step.setAttribute("material", "shader: flat; color: #FFFFFF");
    } else {
      step.setAttribute("color", "#444444");
      step.setAttribute("material", "shader: flat; color: #444444");
    }
  });
}

async function fadeToBlack() {
  fadeOverlay.classList.add("active");

  vrFadeOverlay.setAttribute("visible", true);
  vrFadeOverlay.setAttribute(
    "animation__fade",
    "property: material.opacity; to: 1; dur: 700; easing: easeInOutQuad"
  );

  await sleep(700);
}

async function fadeFromBlack() {
  fadeOverlay.classList.remove("active");

  vrFadeOverlay.setAttribute(
    "animation__fade",
    "property: material.opacity; to: 0; dur: 700; easing: easeInOutQuad"
  );

  await sleep(700);
  vrFadeOverlay.setAttribute("visible", false);
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

    setStatus("Bereit: Drehe dich um 180 Grad");
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
  const direction = new THREE.Vector3();

  camera.object3D.getWorldDirection(direction);

  const radians = Math.atan2(direction.x, direction.z);
  const degrees = THREE.MathUtils.radToDeg(radians);

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

function setupHudButtonVisuals() {
  const buttons = document.querySelectorAll(".hud-button");

  buttons.forEach((button) => {
    const defaultColor = button.getAttribute("color") || "#FFFFFF";
    button.dataset.defaultColor = defaultColor;

    button.addEventListener("mouseenter", () => {
      button.setAttribute("color", "#D9D9D9");
      button.setAttribute("scale", "1.06 1.06 1.06");
    });

    button.addEventListener("mouseleave", () => {
      button.setAttribute("color", button.dataset.defaultColor);
      button.setAttribute("scale", "1 1 1");
    });

    button.addEventListener("mousedown", () => {
      button.setAttribute("scale", "0.94 0.94 0.94");
    });

    button.addEventListener("mouseup", () => {
      button.setAttribute("scale", "1.06 1.06 1.06");
    });
  });
}

function setupWorldControls() {
  prevBtn.addEventListener("click", () => {
    runHudAction(previousWorld);
  });

  nextBtn.addEventListener("click", () => {
    runHudAction(nextWorld);
  });
}

function init() {
  setupHudButtonVisuals();
  setupWorldControls();
  setupAudioControls();

  preloadPanoramas();
  startBackgroundMusic();

  setInterval(checkRotationLoop, 200);
}

if (scene.hasLoaded) {
  init();
} else {
  scene.addEventListener("loaded", init);
}