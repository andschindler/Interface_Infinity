const sky = document.querySelector("#sky");
const camera = document.querySelector("#camera");
const statusText = document.querySelector("#status");

const fallbackPanorama =
  "https://cdn.aframe.io/360-image-gallery-boilerplate/img/sechelt.jpg";

// Exakte Wikimedia-Commons-Kategorie
const categoryName = "Category:360° panoramas with equirectangular projection";

let panoramaPool = [];
let currentIndex = 0;
let lastSide = null;
let isChanging = false;
let nextCategoryContinue = null;

function setStatus(text) {
  statusText.textContent = text;
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
    img.crossOrigin = "anonymous";

    img.onload = () => {
      sky.setAttribute("src", url);

      setTimeout(() => {
        brightenSky();
      }, 100);

      setStatus("Aktuelle Welt: " + label);
      resolve();
    };

    img.onerror = () => {
      reject("Bild konnte nicht geladen werden");
    };

    img.src = url;
  });
}

async function loadImagesFromCategory(categoryTitle, limit = 20, gcmcontinue = null) {
  let apiUrl =
    "https://commons.wikimedia.org/w/api.php" +
    "?origin=*" +
    "&action=query" +
    "&format=json" +
    "&generator=categorymembers" +
    "&gcmtitle=" + encodeURIComponent(categoryTitle) +
    "&gcmtype=file" +
    "&gcmlimit=" + limit +
    "&prop=imageinfo" +
    "&iiprop=url|mime";

  if (gcmcontinue) {
    apiUrl += "&gcmcontinue=" + encodeURIComponent(gcmcontinue);
  }

  const response = await fetch(apiUrl);
  const data = await response.json();

  // Für die nächste "Seite" der Kategorie
  nextCategoryContinue = data.continue?.gcmcontinue || null;

  const pages = data.query?.pages;
  if (!pages) {
    return [];
  }

  const images = Object.values(pages);

  const validImages = images
    .map((img) => {
      const info = img.imageinfo?.[0];
      if (!info) return null;
      if (!info.url) return null;
      if (!info.mime) return null;

      const isImage =
        info.mime === "image/jpeg" ||
        info.mime === "image/png" ||
        info.mime === "image/webp";

      if (!isImage) return null;

      return {
        label: img.title.replace("File:", ""),
        url: info.url
      };
    })
    .filter(Boolean);

  return validImages;
}

function shuffleArray(array) {
  array.sort(() => Math.random() - 0.5);
}

async function preloadPanoramas() {
  setStatus("Lade Welten aus Kategorie...");

  try {
    panoramaPool = await loadImagesFromCategory(categoryName, 20);

    if (panoramaPool.length === 0) {
      panoramaPool.push({
        label: "Fallback Panorama",
        url: fallbackPanorama
      });
    }

    shuffleArray(panoramaPool);
    currentIndex = 0;

    await loadSkyImage(panoramaPool[currentIndex].url, panoramaPool[currentIndex].label);

    setStatus("Bereit: Drehe dich um 180°");
  } catch (error) {
    console.error(error);

    panoramaPool = [
      {
        label: "Fallback Panorama",
        url: fallbackPanorama
      }
    ];

    currentIndex = 0;
    await loadSkyImage(panoramaPool[0].url, panoramaPool[0].label);
    setStatus("Fehler beim Laden der Kategorie");
  }
}

async function loadMorePanoramasIfNeeded() {
  // Wenn wir fast am Ende des Pools sind, neue Bilder aus der nächsten Kategorie-Seite laden
  if (currentIndex < panoramaPool.length - 3) return;
  if (!nextCategoryContinue) return;

  try {
    const newImages = await loadImagesFromCategory(categoryName, 20, nextCategoryContinue);

    if (newImages.length > 0) {
      const existingUrls = new Set(panoramaPool.map(p => p.url));

      const uniqueNewImages = newImages.filter(img => !existingUrls.has(img.url));

      panoramaPool.push(...uniqueNewImages);
    }
  } catch (error) {
    console.error("Fehler beim Nachladen weiterer Panoramen:", error);
  }
}

async function nextWorld() {
  if (isChanging) return;
  if (panoramaPool.length === 0) return;

  isChanging = true;

  currentIndex++;

  // Falls Ende erreicht → mischen und wieder von vorne
  if (currentIndex >= panoramaPool.length) {
    shuffleArray(panoramaPool);
    currentIndex = 0;
  }

  const nextPanorama = panoramaPool[currentIndex];

  await loadSkyImage(nextPanorama.url, nextPanorama.label);
  await loadMorePanoramasIfNeeded();

  setTimeout(() => {
    isChanging = false;
  }, 800);
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