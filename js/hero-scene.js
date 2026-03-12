/**
 * GlowHaven — 3D Molecular Hero Scene
 * Three.js WebGL: luxury molecular structure with champagne-gold spheres,
 * warm metallic connectors, particle dust, bloom, mouse interaction.
 */

/* ── Luxury palette: champagne gold / warm bronze / pearl ── */
const C = {
  bg:          0x0d1820,
  gold:        0xc9a96e,   // rich champagne gold
  goldBright:  0xe2c992,   // lighter highlight gold
  goldDeep:    0x9e7c45,   // deep antique gold
  bronze:      0x8c6239,   // warm bronze accent
  pearl:       0xf0e6d3,   // warm pearl white
  cream:       0xfaf3e8,   // soft cream
  warm:        0xffe8cc,   // warm glow for lights
  white:       0xffffff,
};

let scene, camera, renderer, composer;
let moleculeGroup, particleSystem;
let mouseX = 0, mouseY = 0;
let targetRotX = 0, targetRotY = 0;
let scrollProgress = 0;
let animationId;
let clock;

export function initHeroScene(canvas) {
  if (!canvas) return;

  const THREE = window.THREE;
  if (!THREE) { console.warn('Three.js not loaded'); return; }

  clock = new THREE.Clock();

  // ── Scene ──
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(C.bg, 0.012);

  // ── Camera ──
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 250);
  camera.position.set(0, 1, 28);

  // ── Renderer — high quality ──
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(C.bg, 1);

  // ── Post-processing (bloom) ──
  setupPostProcessing(THREE);

  // ── Lighting — warm, cinematic ──
  const ambient = new THREE.AmbientLight(C.warm, 0.2);
  scene.add(ambient);

  // Main key light — warm white from upper-right
  const keyLight = new THREE.DirectionalLight(C.cream, 0.9);
  keyLight.position.set(12, 18, 10);
  scene.add(keyLight);

  // Gold accent light — left side
  const goldLight = new THREE.PointLight(C.gold, 2.0, 70);
  goldLight.position.set(-10, 6, 10);
  scene.add(goldLight);

  // Warm fill — right-bottom
  const fillLight = new THREE.PointLight(C.goldBright, 0.8, 55);
  fillLight.position.set(8, -5, 8);
  scene.add(fillLight);

  // Rim light — behind and below for depth
  const rimLight = new THREE.PointLight(C.goldDeep, 1.0, 50);
  rimLight.position.set(0, -10, -8);
  scene.add(rimLight);

  // Subtle top backlight for halo
  const haloLight = new THREE.PointLight(C.pearl, 0.4, 40);
  haloLight.position.set(0, 12, -6);
  scene.add(haloLight);

  // ── Build molecule ──
  moleculeGroup = new THREE.Group();
  buildMolecularStructure(THREE);
  scene.add(moleculeGroup);

  // ── Particle field ──
  buildParticleField(THREE);

  // ── Events ──
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Loop ──
  animate();
}

/* ────────────────────────────────────────────────
   MOLECULAR STRUCTURE
   ──────────────────────────────────────────────── */
function buildMolecularStructure(THREE) {
  const nodes = [];

  // Primary sphere — polished champagne gold
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: C.gold,
    metalness: 0.95,
    roughness: 0.08,
    emissive: C.goldDeep,
    emissiveIntensity: 0.08,
    clearcoat: 0.3,
    clearcoatRoughness: 0.1,
  });

  // Core atom — bright polished gold, glowing
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: C.goldBright,
    metalness: 0.98,
    roughness: 0.05,
    emissive: C.gold,
    emissiveIntensity: 0.2,
    clearcoat: 0.5,
    clearcoatRoughness: 0.05,
  });

  // Accent atoms — warm bronze
  const accentMat = new THREE.MeshPhysicalMaterial({
    color: C.bronze,
    metalness: 0.9,
    roughness: 0.15,
    emissive: C.bronze,
    emissiveIntensity: 0.06,
    clearcoat: 0.2,
    clearcoatRoughness: 0.15,
  });

  // Bond material — subtle warm metallic
  const bondMat = new THREE.MeshPhysicalMaterial({
    color: C.goldDeep,
    metalness: 0.85,
    roughness: 0.2,
    emissive: C.goldDeep,
    emissiveIntensity: 0.04,
    transparent: true,
    opacity: 0.6,
  });

  // High-poly geometry — eliminates pixelation
  const sphereGeo      = new THREE.SphereGeometry(1, 64, 64);
  const smallSphereGeo  = new THREE.SphereGeometry(0.55, 48, 48);
  const tinySphereGeo   = new THREE.SphereGeometry(0.35, 40, 40);

  // Node positions
  const positions = [
    [ 0,    0,    0   ],   // core
    [ 3.5,  1.8,  1   ],
    [-3,    2.5, -1.5 ],
    [ 1.5, -3.2,  2   ],
    [-2,   -2.8, -2   ],
    [ 4.5, -1,   -2.5 ],
    [-4,    0.5,  2.5 ],
    [ 0,    4,   -1   ],
    [ 2,    1,   -4   ],
    [-1.5, -1,    4   ],
    [ 3,    3.5,  2.5 ],
    [-3.5, -3,    1   ],
    [ 1,   -4.5, -2   ],
    [-1,    3,    3   ],
  ];

  positions.forEach((pos, i) => {
    let mesh;
    if (i === 0) {
      mesh = new THREE.Mesh(sphereGeo, coreMat);
      mesh.scale.setScalar(1.3);
    } else if (i < 7) {
      mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.scale.setScalar(0.5 + Math.random() * 0.45);
    } else {
      mesh = new THREE.Mesh(
        i % 2 === 0 ? smallSphereGeo : tinySphereGeo,
        i % 3 === 0 ? accentMat : sphereMat
      );
    }

    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.userData.basePos = new THREE.Vector3(pos[0], pos[1], pos[2]);
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;
    mesh.userData.floatSpeed = 0.25 + Math.random() * 0.35;
    mesh.userData.floatAmp = 0.06 + Math.random() * 0.1;
    moleculeGroup.add(mesh);
    nodes.push(mesh);
  });

  // Bonds — smooth round cylinders
  const bonds = [
    [0,1],[0,2],[0,3],[0,4],[0,7],[0,9],
    [1,5],[1,10],[2,6],[2,7],[3,9],[3,12],
    [4,11],[4,12],[5,8],[6,11],[6,13],[7,13],
    [8,10],[9,13],[10,7],[11,12],
  ];

  const bondGeo = new THREE.CylinderGeometry(0.045, 0.045, 1, 24, 1);

  bonds.forEach(([a, b]) => {
    const start = new THREE.Vector3(...positions[a]);
    const end   = new THREE.Vector3(...positions[b]);
    const mid   = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dist  = start.distanceTo(end);

    const bond = new THREE.Mesh(bondGeo, bondMat);
    bond.position.copy(mid);
    bond.scale.set(1, dist, 1);
    bond.lookAt(end);
    bond.rotateX(Math.PI / 2);

    bond.userData.nodeA = a;
    bond.userData.nodeB = b;
    moleculeGroup.add(bond);
  });

  // Glow shells — soft gold aura on key nodes
  const glowMat = new THREE.MeshBasicMaterial({
    color: C.gold,
    transparent: true,
    opacity: 0.045,
    side: THREE.BackSide,
  });

  [0, 1, 2, 3, 5, 7].forEach(i => {
    const r = i === 0 ? 2.4 : 1.5;
    const glowGeo = new THREE.SphereGeometry(r, 32, 32);
    const glow = new THREE.Mesh(glowGeo, glowMat.clone());
    glow.position.copy(nodes[i].position);
    glow.userData.parentIdx = i;
    moleculeGroup.add(glow);
  });

  moleculeGroup.nodes = nodes;
}

/* ────────────────────────────────────────────────
   PARTICLE FIELD — warm gold dust
   ──────────────────────────────────────────────── */
function buildParticleField(THREE) {
  const count = 800;
  const positions = new Float32Array(count * 3);
  const spread = 65;

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Create a soft circular texture so particles look round, not square
  const circleCanvas = document.createElement('canvas');
  circleCanvas.width = 64;
  circleCanvas.height = 64;
  const ctx = circleCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const circleTexture = new THREE.CanvasTexture(circleCanvas);

  const mat = new THREE.PointsMaterial({
    color: C.goldBright,
    size: 0.12,
    map: circleTexture,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  particleSystem = new THREE.Points(geo, mat);
  scene.add(particleSystem);
}

/* ────────────────────────────────────────────────
   POST-PROCESSING (Bloom)
   ──────────────────────────────────────────────── */
function setupPostProcessing(THREE) {
  if (THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    composer = new THREE.EffectComposer(renderer);

    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(w, h),
      0.65,   // strength — subtle luxury glow
      0.5,    // radius
      0.82    // threshold
    );
    composer.addPass(bloomPass);
  }
}

/* ────────────────────────────────────────────────
   ANIMATION LOOP
   ──────────────────────────────────────────────── */
function animate() {
  animationId = requestAnimationFrame(animate);

  const t = clock.getElapsedTime();

  // Smooth mouse follow
  targetRotY += (mouseX * 0.35 - targetRotY) * 0.025;
  targetRotX += (mouseY * 0.25 - targetRotX) * 0.025;

  if (moleculeGroup) {
    // Base rotation — slow, elegant
    moleculeGroup.rotation.y = t * 0.06 + targetRotY;
    moleculeGroup.rotation.x = Math.sin(t * 0.04) * 0.12 + targetRotX;
    moleculeGroup.rotation.z = Math.sin(t * 0.025) * 0.04;

    const nodes = moleculeGroup.nodes;
    if (nodes) {
      // Float individual nodes
      nodes.forEach((node) => {
        const bp  = node.userData.basePos;
        const off = node.userData.floatOffset;
        const spd = node.userData.floatSpeed;
        const amp = node.userData.floatAmp;
        node.position.x = bp.x + Math.sin(t * spd + off) * amp;
        node.position.y = bp.y + Math.cos(t * spd * 0.8 + off) * amp;
        node.position.z = bp.z + Math.sin(t * spd * 0.6 + off + 1) * amp * 0.5;
      });

      // Scroll separation
      const sep = scrollProgress * 6;
      nodes.forEach((node) => {
        const bp  = node.userData.basePos;
        const dir = bp.clone().normalize();
        node.position.add(dir.multiplyScalar(sep * 0.12));
      });
    }

    const s = 1 - scrollProgress * 0.25;
    moleculeGroup.scale.setScalar(Math.max(s, 0.55));
  }

  // Rotate particle field
  if (particleSystem) {
    particleSystem.rotation.y = t * 0.012;
    particleSystem.rotation.x = t * 0.006;
  }

  // Render
  if (composer) {
    composer.render();
  } else if (renderer) {
    renderer.render(scene, camera);
  }
}

/* ────────────────────────────────────────────────
   EVENT HANDLERS
   ──────────────────────────────────────────────── */
function onMouseMove(e) {
  mouseX = (e.clientX / window.innerWidth)  * 2 - 1;
  mouseY = (e.clientY / window.innerHeight) * 2 - 1;
}

function onScroll() {
  const hero = document.querySelector('.hero-section');
  if (hero) {
    const rect = hero.getBoundingClientRect();
    scrollProgress = Math.max(0, Math.min(1, -rect.top / hero.offsetHeight));

    // Parallax: shift camera upward as user scrolls
    if (camera) {
      camera.position.y = 1 + scrollProgress * 6;
    }

    // Parallax: move text layers at different speeds
    const topBar = document.querySelector('.hero-top-bar');
    const center = document.querySelector('.hero-center');

    if (topBar) {
      topBar.style.transform = `translateY(${scrollProgress * -50}px)`;
      topBar.style.opacity = 1 - scrollProgress * 1.5;
    }
    if (center) {
      center.style.transform = `translateY(${scrollProgress * -90}px)`;
      center.style.opacity = 1 - scrollProgress * 1.8;
    }
  }
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
  if (composer) composer.setSize(w, h);
}

/* ────────────────────────────────────────────────
   CLEANUP
   ──────────────────────────────────────────────── */
export function destroyHeroScene() {
  if (animationId) cancelAnimationFrame(animationId);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('scroll', onScroll);
  if (renderer) renderer.dispose();
}
