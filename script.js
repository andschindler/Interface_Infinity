const worlds = [
    {
      skyId: 'sky1',
      label: '🌿 Wiese & Berge',
      hint: 'Dreh dich 180° für den Strand'
    },
  
    {
      skyId: 'sky2',
      label: '🏖️ Strand',
      hint: 'Dreh dich 180° für die Wiese'
    }
  ];
  
  let currentWorld = 0;
  let facingBack = false;
  let transitioning = false;
  
  const camera = document.querySelector('#camera');
  const hud = document.querySelector('#hud');
  const loader = document.querySelector('#loader');
  const scene = document.querySelector('a-scene');
  
  /* Loader ausblenden */
  scene.addEventListener('loaded', () => {
  
    loader.style.opacity = '0';
  
    setTimeout(() => {
      loader.style.display = 'none';
    }, 650);
  
  });
  
  /* Welt wechseln */
  function switchWorld() {
  
    if (transitioning) return;
  
    transitioning = true;
  
    hud.style.opacity = '0';
  
    setTimeout(() => {
  
      document
        .getElementById(worlds[currentWorld].skyId)
        .setAttribute('visible', 'false');
  
      currentWorld = (currentWorld + 1) % worlds.length;
  
      document
        .getElementById(worlds[currentWorld].skyId)
        .setAttribute('visible', 'true');
  
      const w = worlds[currentWorld];
  
      hud.textContent = w.label + ' · ' + w.hint;
  
      hud.style.opacity = '1';
  
      setTimeout(() => {
        transitioning = false;
      }, 1200);
  
    }, 300);
  }
  
  /* Rotation prüfen */
  const BACK_THRESHOLD = (150 * Math.PI) / 180;
  
  scene.addEventListener('loaded', () => {
  
    function tick() {
  
      const obj = camera.object3D;
  
      if (!obj) {
        requestAnimationFrame(tick);
        return;
      }
  
      const isBack =
        Math.abs(obj.rotation.y) > BACK_THRESHOLD;
  
      if (isBack && !facingBack) {
  
        facingBack = true;
  
        switchWorld();
  
      } else if (!isBack && facingBack) {
  
        facingBack = false;
  
      }
  
      requestAnimationFrame(tick);
    }
  
    tick();
  
  });