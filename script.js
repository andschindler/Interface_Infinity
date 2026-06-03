const sky = document.querySelector("#sky");
const statusText = document.querySelector("#status");

const searchTerms = [
  "Eiffel Tower panorama 360",
  "Brandenburg Gate panorama",
  "Colosseum panorama 360",
  "New York skyline panorama",
  "Tokyo panorama 360",
  "Swiss Alps panorama",
  "Istanbul panorama 360"
];

let currentIndex = 0;
let lastSide = null;
let isChanging = false;

async function searchCommonsImage(query) {
  const apiUrl =
    "https://commons.wikimedia.org/w/api.php" +
    "?origin=*" +
    "&action=query" +
    "&format=json" +
    "&generator=search" +
    "&gsrnamespace=6" +
    "&gsrlimit=10" +
    "&gsrsearch=" + encodeURIComponent(query) +
    "&prop=imageinfo" +
    "&iiprop=url|mime";

  const response = await fetch(apiUrl);
  const data = await response.json();

  const pages = data.query?.pages;

  if (!pages) {
    return null;
  }

  const images = Object.values(pages);

  const validImage = images.find((img) => {
    const info = img.imageinfo?.[0];
    return info && info.url && info.mime?.startsWith("image/");
  });

  if (!validImage) {
    return null;
  }

  return validImage.imageinfo[0].url;
}

async function setSkyFromCommons(searchTerm) {
  statusText.textContent = "Lade: " + searchTerm;

  const imageUrl = await searchCommonsImage(searchTerm);

  if (!imageUrl) {
    statusText.textContent = "Kein Panorama gefunden";
    return;
  }

  sky.setAttribute("src", imageUrl);
  statusText.textContent = "Aktuelle Welt: " + searchTerm;
}

async function nextWorld() {
  if (isChanging) return;

  isChanging = true;

  currentIndex = (currentIndex + 1) % searchTerms.length;

  await setSkyFromCommons(searchTerms[currentIndex]);

  setTimeout(() => {
    isChanging = false;
  }, 1200);
}

AFRAME.registerComponent("turn-detector", {
  tick: function () {
    const rotationY = this.el.object3D.rotation.y;
    const degrees = THREE.MathUtils.radToDeg(rotationY);
    const normalized = ((degrees % 360) + 360) % 360;

    const currentSide = normalized > 90 && normalized < 270 ? "back" : "front";

    if (lastSide && currentSide !== lastSide) {
      nextWorld();
    }

    lastSide = currentSide;
  }
});

setSkyFromCommons(searchTerms[currentIndex]);