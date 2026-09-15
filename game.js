import * as THREE from 'three';

// ============ Константы ============
const SIZE = 32;      // ширина/глубина мира
const HEIGHT = 28;    // высота мира
const SAVE_KEY = 'minicraft-save-v1';

const BLOCK = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4,
  LEAVES: 5, SAND: 6, PLANKS: 7, GLASS: 8, BRICK: 9,
};

const BLOCKS = {
  [BLOCK.GRASS]:  { name: 'Трава' },
  [BLOCK.DIRT]:   { name: 'Земля' },
  [BLOCK.STONE]:  { name: 'Камень' },
  [BLOCK.WOOD]:   { name: 'Дерево' },
  [BLOCK.LEAVES]: { name: 'Листва' },
  [BLOCK.SAND]:   { name: 'Песок' },
  [BLOCK.PLANKS]: { name: 'Доски' },
  [BLOCK.GLASS]:  { name: 'Стекло' },
  [BLOCK.BRICK]:  { name: 'Кирпич' },
};
const HOTBAR = [BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.WOOD, BLOCK.LEAVES, BLOCK.SAND, BLOCK.PLANKS, BLOCK.GLASS, BLOCK.BRICK];

// ============ Процедурные пиксельные текстуры 16x16 ============
function makeTex(painter) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const g = c.getContext('2d');
  painter(g);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function noiseFill(g, base, variants, n = 40) {
  g.fillStyle = base; g.fillRect(0, 0, 16, 16);
  for (let i = 0; i < n; i++) {
    g.fillStyle = variants[(Math.random() * variants.length) | 0];
    g.fillRect((Math.random() * 16) | 0, (Math.random() * 16) | 0, 1, 1);
  }
}
const TEX = {};
function buildTextures() {
  TEX.grass_top = makeTex(g => noiseFill(g, '#6abd30', ['#5aa82a', '#7ccc40', '#54a026'], 60));
  TEX.dirt = makeTex(g => noiseFill(g, '#8a5f3c', ['#79522f', '#9c6f47', '#6e4a2a'], 70));
  TEX.grass_side = makeTex(g => {
    noiseFill(g, '#8a5f3c', ['#79522f', '#9c6f47'], 60);
    g.fillStyle = '#6abd30'; g.fillRect(0, 0, 16, 4);
    g.fillStyle = '#5aa82a';
    for (let x = 0; x < 16; x += 2) g.fillRect(x, 4, 1, 1 + ((x * 7) % 2));
  });
  TEX.stone = makeTex(g => noiseFill(g, '#8d8d8d', ['#7d7d7d', '#9d9d9d', '#6f6f6f'], 80));
  TEX.log_side = makeTex(g => {
    g.fillStyle = '#6b4a2b'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#54371f';
    for (let x = 2; x < 16; x += 4) g.fillRect(x, 0, 1, 16);
    g.fillStyle = '#7d5a36';
    for (let i = 0; i < 20; i++) g.fillRect((Math.random() * 16) | 0, (Math.random() * 16) | 0, 1, 2);
  });
  TEX.log_top = makeTex(g => {
    g.fillStyle = '#c8a86b'; g.fillRect(0, 0, 16, 16);
    g.strokeStyle = '#6b4a2b';
    for (let r = 7; r > 0; r -= 2) { g.strokeRect(8 - r, 8 - r, r * 2, r * 2); }
  });
  TEX.leaves = makeTex(g => {
    noiseFill(g, '#2f9e44', ['#277c36', '#3cbf54', '#1f6b2d'], 90);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    for (let i = 0; i < 12; i++) g.fillRect((Math.random() * 16) | 0, (Math.random() * 16) | 0, 2, 2);
  });
  TEX.sand = makeTex(g => noiseFill(g, '#e3d79b', ['#d4c684', '#f0e6b0'], 70));
  TEX.planks = makeTex(g => {
    g.fillStyle = '#c19a5b'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#8f6d3a';
    for (let y = 3; y < 16; y += 4) g.fillRect(0, y, 16, 1);
    g.fillRect(8, 0, 1, 4); g.fillRect(4, 4, 1, 4); g.fillRect(12, 8, 1, 4);
    noiseFill(g, 'rgba(0,0,0,0)', ['rgba(0,0,0,0.12)'], 25);
  });
  TEX.glass = makeTex(g => {
    g.fillStyle = 'rgba(200,235,255,0.55)'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16);
    g.fillRect(0, 15, 16, 1); g.fillRect(15, 0, 1, 16);
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(3, 9, 2, 4); g.fillRect(9, 3, 4, 2);
  });
  TEX.brick = makeTex(g => {
    g.fillStyle = '#b0513f'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#d9d9d9'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 16, 1);
    for (let y = 0; y < 16; y += 4) g.fillRect(0, y, 16, 1);
    for (let y = 0; y < 16; y += 4) for (let x = (y % 8 === 0 ? 8 : 0); x < 16; x += 8) g.fillRect(x, y, 1, 4);
    noiseFill(g, 'rgba(0,0,0,0)', ['rgba(0,0,0,0.15)'], 30);
  });
}
buildTextures();

function materialsFor(type) {
  const lam = (map, opts = {}) => new THREE.MeshLambertMaterial({ map, ...opts });
  switch (type) {
    case BLOCK.GRASS: return [lam(TEX.grass_side), lam(TEX.grass_side), lam(TEX.grass_top), lam(TEX.dirt), lam(TEX.grass_side), lam(TEX.grass_side)];
    case BLOCK.DIRT: { const m = lam(TEX.dirt); return [m, m, m, m, m, m]; }
    case BLOCK.STONE: { const m = lam(TEX.stone); return [m, m, m, m, m, m]; }
    case BLOCK.WOOD: return [lam(TEX.log_side), lam(TEX.log_side), lam(TEX.log_top), lam(TEX.log_top), lam(TEX.log_side), lam(TEX.log_side)];
    case BLOCK.LEAVES: { const m = lam(TEX.leaves); return [m, m, m, m, m, m]; }
    case BLOCK.SAND: { const m = lam(TEX.sand); return [m, m, m, m, m, m]; }
    case BLOCK.PLANKS: { const m = lam(TEX.planks); return [m, m, m, m, m, m]; }
    case BLOCK.GLASS: { const m = lam(TEX.glass, { transparent: true, opacity: 0.75 }); return [m, m, m, m, m, m]; }
    case BLOCK.BRICK: { const m = lam(TEX.brick); return [m, m, m, m, m, m]; }
    default: { const m = lam(TEX.stone); return [m, m, m, m, m, m]; }
  }
}

// ============ Мир (воксельные данные) ============
const world = new Uint8Array(SIZE * HEIGHT * SIZE);
const idx = (x, y, z) => (y * SIZE + z) * SIZE + x;
const inBounds = (x, y, z) => x >= 0 && x < SIZE && y >= 0 && y < HEIGHT && z >= 0 && z < SIZE;
function getBlock(x, y, z) {
  if (!inBounds(x, y, z)) return y < 0 ? BLOCK.STONE : BLOCK.AIR; // дно — камень
  return world[idx(x, y, z)];
}
function setBlock(x, y, z, t) { if (inBounds(x, y, z)) world[idx(x, y, z)] = t; }
const isOpaque = t => t !== BLOCK.AIR && t !== BLOCK.GLASS;

function hash2(x, z) { let h = (x * 374761393 + z * 668265263) | 0; h = (h ^ (h >> 13)) | 0; h = (h * 1274126177) | 0; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }
function heightAt(x, z) {
  return Math.floor(6
    + Math.sin(x * 0.45) * 1.4 + Math.cos(z * 0.4) * 1.4
    + Math.sin((x + z) * 0.22) * 1.1 + hash2(x, z) * 1.2);
}

function generateWorld(seed = (Math.random() * 1e9) | 0) {
  world.fill(BLOCK.AIR);
  for (let x = 0; x < SIZE; x++) for (let z = 0; z < SIZE; z++) {
    const h = THREE.MathUtils.clamp(heightAt(x + (seed % 17), z + (seed % 13)), 2, HEIGHT - 8);
    for (let y = 0; y <= h; y++) {
      let t = BLOCK.STONE;
      if (y === h) t = h <= 3 ? BLOCK.SAND : BLOCK.GRASS;
      else if (y >= h - 2) t = h <= 3 ? BLOCK.SAND : BLOCK.DIRT;
      setBlock(x, y, z, t);
    }
  }
  // деревья
  let trees = 0;
  for (let i = 0; i < 60 && trees < 8; i++) {
    const x = 3 + ((Math.random() * (SIZE - 6)) | 0), z = 3 + ((Math.random() * (SIZE - 6)) | 0);
    const h = heightAt(x + (seed % 17), z + (seed % 13));
    if (h <= 3 || getBlock(x, h, z) !== BLOCK.GRASS) continue;
    const th = 3 + ((Math.random() * 2) | 0);
    for (let y = h + 1; y <= h + th; y++) setBlock(x, y, z, BLOCK.WOOD);
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = 0; dy <= 2; dy++) {
      if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
      const lx = x + dx, ly = h + th - 2 + dy, lz = z + dz;
      if (inBounds(lx, ly, lz) && getBlock(lx, ly, lz) === BLOCK.AIR) setBlock(lx, ly, lz, BLOCK.LEAVES);
    }
    setBlock(x, h + th + 1, z, BLOCK.LEAVES);
    trees++;
  }
}

// ============ Three.js сцена ============
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 25, 70);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 200);

scene.add(new THREE.HemisphereLight(0xffffff, 0x6b8e5a, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(20, 35, 12);
scene.add(sun);

// рамка подсветки выбранного блока
const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
  new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.7 })
);
highlight.visible = false;
scene.add(highlight);

// сетка из InstancedMesh по типам блоков
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const meshes = {};
const dummy = new THREE.Object3D();
function rebuildWorld() {
  for (const k of Object.keys(meshes)) { scene.remove(meshes[k]); meshes[k].dispose?.(); delete meshes[k]; }
  const positions = {};
  for (const t of HOTBAR) positions[t] = [];
  for (let x = 0; x < SIZE; x++) for (let y = 0; y < HEIGHT; y++) for (let z = 0; z < SIZE; z++) {
    const t = getBlock(x, y, z);
    if (t === BLOCK.AIR) continue;
    // скрытые грани — пропускаем полностью закрытые блоки
    if (isOpaque(getBlock(x + 1, y, z)) && isOpaque(getBlock(x - 1, y, z)) &&
        isOpaque(getBlock(x, y + 1, z)) && isOpaque(getBlock(x, y - 1, z)) &&
        isOpaque(getBlock(x, y, z + 1)) && isOpaque(getBlock(x, y, z - 1))) continue;
    positions[t].push([x, y, z]);
  }
  for (const t of HOTBAR) {
    const list = positions[t];
    if (!list.length) continue;
    const im = new THREE.InstancedMesh(boxGeo, materialsFor(t), Math.max(list.length, 1));
    list.forEach(([x, y, z], i) => { dummy.position.set(x + 0.5, y + 0.5, z + 0.5); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
    im.count = list.length;
    im.instanceMatrix.needsUpdate = true;
    scene.add(im);
    meshes[t] = im;
  }
}

// ============ Игрок и физика ============
const player = {
  pos: new THREE.Vector3(SIZE / 2 + 0.5, 12, SIZE / 2 + 0.5),
  vel: new THREE.Vector3(),
  yaw: Math.PI * 0.25, pitch: -0.1,
  onGround: false, fly: false,
  w: 0.6, h: 1.8, eye: 1.62,
};
const keys = {};
let selected = 0;

function collide(pos) {
  const p = player;
  const min = new THREE.Vector3(pos.x - p.w / 2, pos.y, pos.z - p.w / 2);
  const max = new THREE.Vector3(pos.x + p.w / 2, pos.y + p.h, pos.z + p.w / 2);
  for (let x = Math.floor(min.x); x <= Math.floor(max.x - 1e-6); x++)
    for (let y = Math.floor(min.y); y <= Math.floor(max.y - 1e-6); y++)
      for (let z = Math.floor(min.z); z <= Math.floor(max.z - 1e-6); z++)
        if (getBlock(x, y, z) !== BLOCK.AIR) return true;
  return false;
}
function moveAxis(axis, amount) {
  const p = player.pos;
  const before = p.clone();
  p[axis] += amount;
  // стены мира
  p.x = THREE.MathUtils.clamp(p.x, 1, SIZE - 1);
  p.z = THREE.MathUtils.clamp(p.z, 1, SIZE - 1);
  if (p.y < 1) { p.y = 1; player.vel.y = 0; player.onGround = true; }
  if (collide(p)) {
    // пошаговое приближение для точности
    p.copy(before);
    const step = Math.sign(amount) * 0.05;
    for (let moved = 0; Math.abs(moved) < Math.abs(amount); moved += Math.abs(step)) {
      p[axis] += step;
      if (collide(p)) { p[axis] -= step; break; }
    }
    if (axis === 'y') {
      if (amount < 0) player.onGround = true;
      player.vel.y = 0;
    }
    return true;
  }
  if (axis === 'y') player.onGround = false;
  return false;
}

function updatePlayer(dt) {
  const speed = player.fly ? 10 : (keys['ShiftLeft'] || keys['ShiftRight'] ? 6.5 : 4.5);
  const f = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const r = new THREE.Vector3(-f.z, 0, f.x);
  const wish = new THREE.Vector3();
  if (keys['KeyW'] || joyVec.y < -0.2) wish.add(f);
  if (keys['KeyS'] || joyVec.y > 0.2) wish.sub(f);
  if (keys['KeyA'] || joyVec.x < -0.2) wish.sub(r);
  if (keys['KeyD'] || joyVec.x > 0.2) wish.add(r);
  if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed * dt);

  if (player.fly) {
    if (keys['Space'] || touchJump) wish.y += speed * dt;
    if (keys['ShiftLeft'] || keys['KeyC']) wish.y -= speed * dt;
    player.pos.add(wish);
    if (collide(player.pos)) player.pos.sub(wish);
    player.vel.set(0, 0, 0);
  } else {
    moveAxis('x', wish.x);
    moveAxis('z', wish.z);
    player.vel.y -= 25 * dt;
    if ((keys['Space'] || touchJump) && player.onGround) { player.vel.y = 8.5; player.onGround = false; }
    player.vel.y = THREE.MathUtils.clamp(player.vel.y, -20, 12);
    moveAxis('y', player.vel.y * dt);
  }
  camera.position.set(player.pos.x, player.pos.y + player.eye, player.pos.z);
  camera.rotation.set(0, 0, 0, 'YXZ');
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
}

// ============ Рейкаст по вокселям (DDA) ============
function raycastVoxel(maxDist = 6) {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  let x = Math.floor(camera.position.x), y = Math.floor(camera.position.y), z = Math.floor(camera.position.z);
  const stepX = Math.sign(dir.x), stepY = Math.sign(dir.y), stepZ = Math.sign(dir.z);
  const tDeltaX = stepX ? Math.abs(1 / dir.x) : Infinity;
  const tDeltaY = stepY ? Math.abs(1 / dir.y) : Infinity;
  const tDeltaZ = stepZ ? Math.abs(1 / dir.z) : Infinity;
  let tMaxX = stepX ? ((stepX > 0 ? (x + 1 - camera.position.x) : (camera.position.x - x)) * tDeltaX) : Infinity;
  let tMaxY = stepY ? ((stepY > 0 ? (y + 1 - camera.position.y) : (camera.position.y - y)) * tDeltaY) : Infinity;
  let tMaxZ = stepZ ? ((stepZ > 0 ? (z + 1 - camera.position.z) : (camera.position.z - z)) * tDeltaZ) : Infinity;
  let nx = 0, ny = 0, nz = 0, t = 0;
  for (let i = 0; i < 100; i++) {
    if (tMaxX < tMaxY && tMaxX < tMaxZ) { x += stepX; t = tMaxX; tMaxX += tDeltaX; nx = -stepX; ny = 0; nz = 0; }
    else if (tMaxY < tMaxZ) { y += stepY; t = tMaxY; tMaxY += tDeltaY; nx = 0; ny = -stepY; nz = 0; }
    else { z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; nx = 0; ny = 0; nz = -stepZ; }
    if (t > maxDist) return null;
    const b = getBlock(x, y, z);
    if (b !== BLOCK.AIR) return { x, y, z, nx, ny, nz, type: b };
  }
  return null;
}

function playerAABBIntersects(x, y, z) {
  const p = player.pos;
  return x + 1 > p.x - player.w / 2 && x < p.x + player.w / 2 &&
         y + 1 > p.y && y < p.y + player.h &&
         z + 1 > p.z - player.w / 2 && z < p.z + player.w / 2;
}

function breakBlock() {
  const hit = raycastVoxel();
  if (!hit) return;
  if (hit.y === 0) { toast('Нельзя сломать коренную породу'); return; }
  setBlock(hit.x, hit.y, hit.z, BLOCK.AIR);
  rebuildWorld();
  save();
}
function placeBlock() {
  const hit = raycastVoxel();
  if (!hit) return;
  const x = hit.x + hit.nx, y = hit.y + hit.ny, z = hit.z + hit.nz;
  if (!inBounds(x, y, z)) return;
  if (getBlock(x, y, z) !== BLOCK.AIR) return;
  if (playerAABBIntersects(x, y, z)) { toast('Здесь стоит игрок'); return; }
  setBlock(x, y, z, HOTBAR[selected]);
  rebuildWorld();
  save();
}

// ============ Сохранение ============
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ seed: currentSeed, blocks: Array.from(world), px: player.pos.x, py: player.pos.y, pz: player.pos.z })); } catch {}
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!s || !s.blocks || s.blocks.length !== world.length) return false;
    world.set(s.blocks);
    if (s.px) player.pos.set(s.px, s.py, s.pz);
    currentSeed = s.seed ?? 0;
    return true;
  } catch { return false; }
}

// ============ UI: хотбар, тосты ============
let currentSeed = 0;
const hotbarEl = document.getElementById('hotbar');
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
}
function blockPreviewTexture(type) {
  const map = { [BLOCK.GRASS]: TEX.grass_side, [BLOCK.DIRT]: TEX.dirt, [BLOCK.STONE]: TEX.stone, [BLOCK.WOOD]: TEX.log_side, [BLOCK.LEAVES]: TEX.leaves, [BLOCK.SAND]: TEX.sand, [BLOCK.PLANKS]: TEX.planks, [BLOCK.GLASS]: TEX.glass, [BLOCK.BRICK]: TEX.brick }[type];
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  c.getContext('2d').drawImage(map.image, 0, 0, 32, 32);
  return c;
}
function buildHotbar() {
  hotbarEl.innerHTML = '';
  HOTBAR.forEach((t, i) => {
    const d = document.createElement('div');
    d.className = 'slot' + (i === selected ? ' active' : '');
    d.title = BLOCKS[t].name;
    d.appendChild(blockPreviewTexture(t));
    const label = document.createElement('span'); label.textContent = BLOCKS[t].name; d.appendChild(label);
    const num = document.createElement('span'); num.className = 'num'; num.textContent = i + 1; d.appendChild(num);
    d.onclick = e => { e.stopPropagation(); selected = i; buildHotbar(); };
    hotbarEl.appendChild(d);
  });
}

// ============ Управление ============
const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const playBtn = document.getElementById('playBtn');
const regenBtn = document.getElementById('regenBtn');
const touchUI = document.getElementById('touch');
const isTouch = matchMedia('(pointer: coarse)').matches;

let locked = false;
playBtn.onclick = () => {
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  if (isTouch) touchUI.classList.remove('hidden');
  else canvas.requestPointerLock?.();
};
regenBtn.onclick = () => {
  localStorage.removeItem(SAVE_KEY);
  currentSeed = (Math.random() * 1e9) | 0;
  generateWorld(currentSeed);
  spawnPlayer();
  rebuildWorld();
  toast('🌍 Новый мир создан');
};
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  if (!locked && !isTouch && !menu.classList.contains('hidden')) return;
  if (!locked && !isTouch) { menu.classList.remove('hidden'); }
});
document.addEventListener('mousemove', e => {
  if (!locked) return;
  player.yaw -= e.movementX * 0.0025;
  player.pitch = THREE.MathUtils.clamp(player.pitch - e.movementY * 0.0025, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
});
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code.startsWith('Digit')) {
    const n = +e.code.slice(5) - 1;
    if (n >= 0 && n < HOTBAR.length) { selected = n; buildHotbar(); }
  }
  if (e.code === 'KeyF') toggleFly();
  if (e.code === 'Space') e.preventDefault();
});
document.addEventListener('keyup', e => keys[e.code] = false);
addEventListener('wheel', e => {
  if (menu.classList.contains('hidden')) {
    selected = (selected + (e.deltaY > 0 ? 1 : -1) + HOTBAR.length) % HOTBAR.length;
    buildHotbar();
  }
}, { passive: true });

canvas.addEventListener('mousedown', e => {
  if (!locked && !isTouch) { canvas.requestPointerLock?.(); return; }
  if (e.button === 0) breakBlock();
  if (e.button === 2) placeBlock();
});
document.addEventListener('contextmenu', e => e.preventDefault());

function toggleFly() {
  player.fly = !player.fly;
  player.vel.set(0, 0, 0);
  document.getElementById('mode').textContent = player.fly ? '🕊 Полёт' : '🚶 Ходьба';
  toast(player.fly ? '🕊 Режим полёта (Пробел/C — вверх/вниз)' : '🚶 Режим ходьбы');
}

// тач: взгляд свайпом + джойстик + кнопки
const joyVec = { x: 0, y: 0 };
let touchJump = false;
{
  const joy = document.getElementById('joy'), stick = document.getElementById('stick');
  let joyId = null;
  joy.addEventListener('touchstart', e => { joyId = e.changedTouches[0].identifier; }, { passive: true });
  addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) {
        const r = joy.getBoundingClientRect();
        let dx = (t.clientX - (r.left + r.width / 2)) / (r.width / 2);
        let dy = (t.clientY - (r.top + r.height / 2)) / (r.height / 2);
        dx = THREE.MathUtils.clamp(dx, -1, 1); dy = THREE.MathUtils.clamp(dy, -1, 1);
        joyVec.x = dx; joyVec.y = dy;
        stick.style.transform = `translate(calc(-50% + ${dx * 32}px), calc(-50% + ${dy * 32}px))`;
      }
    }
  }, { passive: true });
  addEventListener('touchend', e => {
    for (const t of e.changedTouches) if (t.identifier === joyId) { joyId = null; joyVec.x = joyVec.y = 0; stick.style.transform = 'translate(-50%,-50%)'; }
  });
  let lastLook = null;
  canvas.addEventListener('touchstart', e => { lastLook = e.changedTouches[0]; }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    const t = e.changedTouches[0];
    if (lastLook) {
      player.yaw -= (t.clientX - lastLook.clientX) * 0.006;
      player.pitch = THREE.MathUtils.clamp(player.pitch - (t.clientY - lastLook.clientY) * 0.006, -1.5, 1.5);
    }
    lastLook = t;
  }, { passive: true });
  canvas.addEventListener('touchend', () => lastLook = null);
  document.querySelectorAll('#touchBtns button').forEach(b => {
    b.addEventListener('touchstart', e => {
      e.preventDefault();
      const a = b.dataset.act;
      if (a === 'jump') touchJump = true;
      if (a === 'break') breakBlock();
      if (a === 'place') placeBlock();
      if (a === 'fly') toggleFly();
    });
    b.addEventListener('touchend', () => { if (b.dataset.act === 'jump') touchJump = false; });
  });
}

function spawnPlayer() {
  // ищем свободную колонну без дерева над головой
  for (let r = 0; r < SIZE / 2; r++) {
    for (const [dx, dz] of [[r, 0], [-r, 0], [0, r], [0, -r], [0, 0]]) {
      const cx = (SIZE >> 1) + dx, cz = (SIZE >> 1) + dz;
      if (cx < 1 || cz < 1 || cx >= SIZE - 1 || cz >= SIZE - 1) continue;
      let top = 0;
      for (let y = HEIGHT - 1; y > 0; y--) if (getBlock(cx, y, cz) !== BLOCK.AIR) { top = y; break; }
      if (getBlock(cx, top + 1, cz) === BLOCK.AIR && getBlock(cx, top + 2, cz) === BLOCK.AIR) {
        player.pos.set(cx + 0.5, top + 1.01, cz + 0.5);
        player.vel.set(0, 0, 0);
        return;
      }
    }
  }
  player.pos.set(SIZE / 2 + 0.5, HEIGHT - 4, SIZE / 2 + 0.5);
  player.vel.set(0, 0, 0);
}

// ============ Главный цикл ============
const fpsEl = document.getElementById('fps');
const posEl = document.getElementById('pos');
let last = performance.now(), frames = 0, fpsT = 0;

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  updatePlayer(dt);

  const hit = raycastVoxel();
  if (hit) { highlight.visible = true; highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5); }
  else highlight.visible = false;

  renderer.render(scene, camera);

  frames++; fpsT += dt;
  if (fpsT >= 0.5) {
    fpsEl.textContent = Math.round(frames / fpsT) + ' FPS';
    posEl.textContent = `${player.pos.x.toFixed(0)}, ${player.pos.y.toFixed(0)}, ${player.pos.z.toFixed(0)}`;
    frames = 0; fpsT = 0;
  }
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ============ Старт ============
if (!load()) { currentSeed = (Math.random() * 1e9) | 0; generateWorld(currentSeed); spawnPlayer(); }
rebuildWorld();
buildHotbar();
requestAnimationFrame(loop);
window.__minicraft = { player, getBlock, setBlock, rebuildWorld, raycastVoxel };
