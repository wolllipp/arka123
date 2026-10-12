/* АРКА 123 — интерактивная 3D-модель зала (Three.js)
   Размеры по фото и описанию: ~11 × 11,2 м (≈123 м²), потолок 4,5 м,
   окна-арки 3 и 4 м шириной, высота 3,5 м, пол-ёлочка, потолок антрацит,
   33 линейных светильника, графитовые колонны, стеклянная перегородка. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const stage = document.getElementById("roomStage");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const gsap = window.gsap;

/* ---------- размеры ---------- */
const W = 11, D = 11.2, H = 4.5, T = 0.3;
const SILL = 0.8, WIN_H = 3.5;
const WINDOWS = [
  { cx: -2.7, w: 3.0 },
  { cx: 2.3, w: 4.0 },
];

/* ---------- рендерер ---------- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
} catch (e) {
  document.getElementById("roomFallback").style.display = "grid";
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#11181e");

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
const HOME = { pos: new THREE.Vector3(14.5, 12.5, 16.5), target: new THREE.Vector3(0, 1.1, 0) };
camera.position.copy(HOME.pos);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(HOME.target);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.enableZoom = false; // колесо не перехватывает скролл страницы, пока нет клика
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.7;
controls.minDistance = 7;
controls.maxDistance = 32;
controls.maxPolarAngle = 1.48;
controls.autoRotate = !reduce;
controls.autoRotateSpeed = 0.35;
controls.addEventListener("start", () => (controls.autoRotate = false));
renderer.domElement.addEventListener("pointerdown", () => (controls.enableZoom = !inside));
stage.addEventListener("pointerleave", () => (controls.enableZoom = false));

/* ---------- детерминированный ГСЧ ---------- */
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/* ---------- текстуры ---------- */
function herringbone() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d");
  const a = 128, t = 32;
  g.fillStyle = "#b98f62";
  g.fillRect(0, 0, 1024, 1024);
  for (let col = 0; col < 8; col++) {
    const x0 = col * a;
    for (let y = -a; y < 1024 + a; y += t) {
      const l = 58 + rnd() * 10, s = 42 + rnd() * 10, hue = 30 + rnd() * 5;
      g.fillStyle = `hsl(${hue} ${s}% ${l}%)`;
      g.beginPath();
      if (col % 2 === 0) {
        g.moveTo(x0, y); g.lineTo(x0 + a, y - a); g.lineTo(x0 + a, y - a + t); g.lineTo(x0, y + t);
      } else {
        g.moveTo(x0, y - a); g.lineTo(x0 + a, y); g.lineTo(x0 + a, y + t); g.lineTo(x0, y - a + t);
      }
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(90,60,30,0.35)";
      g.lineWidth = 1.2;
      g.stroke();
      // волокна
      g.save();
      g.clip();
      g.strokeStyle = "rgba(110,75,40,0.08)";
      for (let k = 0; k < 6; k++) {
        const off = rnd() * t;
        g.beginPath();
        if (col % 2 === 0) { g.moveTo(x0, y + off); g.lineTo(x0 + a, y - a + off); }
        else { g.moveTo(x0, y - a + off); g.lineTo(x0 + a, y + off); }
        g.stroke();
      }
      g.restore();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(W / 3.4, D / 3.4);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function slideTexture(redraw) {
  const c = redraw || document.createElement("canvas");
  c.width = 1280; c.height = 720;
  const g = c.getContext("2d");
  g.fillStyle = "#1f2f3b"; g.fillRect(0, 0, 1280, 720);
  g.fillStyle = "#f2b36b"; g.font = "600 34px Inter, sans-serif"; g.fillText("МАСТЕР-КЛАСС · 18:00", 96, 250);
  g.fillStyle = "#f4f0e8"; g.font = "800 92px Manrope, sans-serif";
  g.fillText("Встречаемся", 96, 380); g.fillText("напротив Библиотеки.", 96, 480);
  if (redraw) return;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (!redraw) document.fonts?.ready.then(() => { slideTexture(c); tex.needsUpdate = true; });
  return tex;
}

function edgeFade() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(128, 128, 40, 128, 128, 128);
  grd.addColorStop(0, "#fff"); grd.addColorStop(0.7, "#fff"); grd.addColorStop(1, "#000");
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/* ---------- материалы ---------- */
const M = {
  plaster: () => new THREE.MeshStandardMaterial({ color: "#ece2d1", roughness: 0.95 }),
  panel: () => new THREE.MeshStandardMaterial({ color: "#f3f2ee", roughness: 0.6 }),
  graphite: new THREE.MeshStandardMaterial({ color: "#30373e", roughness: 0.7 }),
  frame: new THREE.MeshStandardMaterial({ color: "#1b2126", roughness: 0.45, metalness: 0.3 }),
  ceiling: new THREE.MeshStandardMaterial({ color: "#2a2e32", roughness: 0.9, side: THREE.DoubleSide }),
  bar: new THREE.MeshBasicMaterial({ color: "#fffaf0", toneMapped: false }),
  floor: new THREE.MeshStandardMaterial({ map: herringbone(), roughness: 0.55 }),
  glass: new THREE.MeshPhysicalMaterial({ color: "#cfe0e6", transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false }),
  frost: new THREE.MeshStandardMaterial({ color: "#e9eef0", transparent: true, opacity: 0.55, roughness: 0.4, depthWrite: false }),
};

/* ---------- геометрия зала ---------- */
const room = new THREE.Group();
scene.add(room);
const walls = []; // { group, n: нормаль наружу, c: центр }

function archPath(path, cx, w, inset = 0) {
  const r = w / 2 - inset;
  const rect = WIN_H - w / 2;
  const y0 = SILL + inset;
  path.moveTo(cx - r, y0);
  path.lineTo(cx + r, y0);
  path.lineTo(cx + r, SILL + rect);
  path.absarc(cx, SILL + rect, r, 0, Math.PI, false);
  path.lineTo(cx - r, y0);
  return path;
}

function shadowy(mesh, cast = true, receive = true) {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

// пол
const floor = shadowy(new THREE.Mesh(new THREE.PlaneGeometry(W, D), M.floor), false, true);
floor.rotation.x = -Math.PI / 2;
room.add(floor);
// «плита» под полом — даёт объём макету
const slab = new THREE.Mesh(new THREE.BoxGeometry(W + 2 * T, 0.25, D + 2 * T), new THREE.MeshStandardMaterial({ color: "#1c2329", roughness: 1 }));
slab.position.y = -0.15; // верх плиты ниже пола на 2,5 см — без z-fighting
room.add(slab);

// северная стена с арками
{
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2 - T, 0); shape.lineTo(W / 2 + T, 0); shape.lineTo(W / 2 + T, H); shape.lineTo(-W / 2 - T, H); shape.lineTo(-W / 2 - T, 0);
  WINDOWS.forEach(({ cx, w }) => shape.holes.push(archPath(new THREE.Path(), cx, w)));
  const wall = shadowy(new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 48 }), M.plaster()));
  wall.position.z = -D / 2 - T;
  g.add(wall);

  WINDOWS.forEach(({ cx, w }) => {
    // рама по контуру арки
    const ring = archPath(new THREE.Shape(), cx, w);
    ring.holes.push(archPath(new THREE.Path(), cx, w, 0.08));
    const frame = shadowy(new THREE.Mesh(new THREE.ExtrudeGeometry(ring, { depth: 0.1, bevelEnabled: false, curveSegments: 48 }), M.frame));
    frame.position.z = -D / 2 - T / 2 - 0.05;
    g.add(frame);
    // импосты: 2 вертикали + горизонталь на линии пяты арки
    const r = w / 2, rect = WIN_H - r;
    [-w / 6, w / 6].forEach((dx) => {
      const top = SILL + rect + Math.sqrt(r * r - dx * dx);
      const m = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.06, top - SILL, 0.08), M.frame));
      m.position.set(cx + dx, SILL + (top - SILL) / 2, -D / 2 - T / 2);
      g.add(m);
    });
    const tr = shadowy(new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.08), M.frame));
    tr.position.set(cx, SILL + rect, -D / 2 - T / 2);
    g.add(tr);
    const tr2 = tr.clone();
    tr2.position.y = SILL + rect * 0.38;
    g.add(tr2);
    // стекло
    const glass = new THREE.Mesh(new THREE.ShapeGeometry(archPath(new THREE.Shape(), cx, w), 48), M.glass);
    glass.position.z = -D / 2 - T / 2;
    g.add(glass);
    // подоконник и радиатор — внутри зала, не прячем
    const sill = shadowy(new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.04, 0.32), M.frame));
    sill.position.set(cx, SILL, -D / 2 + 0.1);
    room.add(sill);
    const rad = shadowy(new THREE.Mesh(new THREE.BoxGeometry(Math.min(1.7, w * 0.5), 0.5, 0.09), M.graphite));
    rad.position.set(cx, 0.38, -D / 2 + 0.08);
    room.add(rad);
  });
  room.add(g);
  walls.push({ group: g, n: new THREE.Vector3(0, 0, -1), c: new THREE.Vector3(0, H / 2, -D / 2) });
}

// западная и восточная стены
function solidWall(len, matFactory, pos, rotY, n) {
  const g = new THREE.Group();
  const m = shadowy(new THREE.Mesh(new THREE.BoxGeometry(len, H, T), matFactory()));
  g.add(m);
  g.position.copy(pos);
  g.rotation.y = rotY;
  room.add(g);
  walls.push({ group: g, n, c: pos.clone().setY(H / 2) });
  return g;
}
solidWall(D + 2 * T, M.plaster, new THREE.Vector3(-W / 2 - T / 2, H / 2, 0), Math.PI / 2, new THREE.Vector3(-1, 0, 0));
const east = solidWall(D + 2 * T, M.plaster, new THREE.Vector3(W / 2 + T / 2, H / 2, 0), Math.PI / 2, new THREE.Vector3(1, 0, 0));

// часы на восточной стене — как на фото (в локальных осях стены: плоскость x-y, внутрь зала — −z)
{
  const clock = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const big = i % 3 === 0;
    const m = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.07 : 0.035, big ? 0.16 : 0.1, 0.03), M.frame);
    m.position.set(Math.sin(a) * 0.85, Math.cos(a) * 0.85, 0);
    m.rotation.z = -a;
    clock.add(m);
  }
  const hand1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.6, 0.03).translate(0, 0.3, 0), M.frame);
  const hand2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.03).translate(0, 0.22, 0), M.frame);
  hand2.rotation.z = -1.9;
  clock.add(hand1, hand2);
  clock.position.set(0.5, 2.75 - H / 2, -T / 2 - 0.02);
  east.add(clock);
}

// южная стена: белые панели + стеклянная перегородка с дверью
{
  const g = new THREE.Group();
  const panelLen = 4.2;
  const p = shadowy(new THREE.Mesh(new THREE.BoxGeometry(panelLen, H, T), M.panel()));
  p.position.set(-W / 2 - T + panelLen / 2, H / 2, D / 2 + T / 2);
  g.add(p);
  // швы панелей
  for (let i = 1; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.01, H, 0.01), M.graphite);
    s.position.set(-W / 2 - T + (panelLen / 4) * i, H / 2, D / 2 - 0.005);
    g.add(s);
  }
  const glassLen = W + 2 * T - panelLen;
  const x0 = -W / 2 - T + panelLen;
  const glass = new THREE.Mesh(new THREE.BoxGeometry(glassLen, H - 0.4, 0.02), M.frost);
  glass.position.set(x0 + glassLen / 2, (H - 0.4) / 2, D / 2 + 0.05);
  g.add(glass);
  // матовые полосы и профили
  [1.1, 1.45].forEach((y) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(glassLen, 0.1, 0.025), new THREE.MeshStandardMaterial({ color: "#c9d1d4", roughness: 0.5 }));
    b.position.set(x0 + glassLen / 2, y, D / 2 + 0.05);
    g.add(b);
  });
  for (let i = 0; i <= 5; i++) {
    const m = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.05, H - 0.4, 0.06), M.frame));
    m.position.set(x0 + (glassLen / 5) * i, (H - 0.4) / 2, D / 2 + 0.05);
    g.add(m);
  }
  const top = shadowy(new THREE.Mesh(new THREE.BoxGeometry(glassLen, 0.4, T), M.graphite));
  top.position.set(x0 + glassLen / 2, H - 0.2, D / 2 + T / 2);
  g.add(top);
  room.add(g);
  walls.push({ group: g, n: new THREE.Vector3(0, 0, 1), c: new THREE.Vector3(0, H / 2, D / 2) });
}

// плинтус по периметру
[
  [W, 0.08, 0.02, 0, -D / 2 + 0.01],
  [W, 0.08, 0.02, 0, D / 2 - 0.01],
].forEach(([w, h, d, x, z]) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.graphite);
  m.position.set(x, h / 2, z);
  room.add(m);
});
[-1, 1].forEach((s) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, D), M.graphite);
  m.position.set((s * W) / 2 - s * 0.01, 0.04, 0);
  room.add(m);
});

// колонны
[[-3.9, 3.6], [3.9, 3.6]].forEach(([x, z]) => {
  const c = shadowy(new THREE.Mesh(new THREE.BoxGeometry(0.6, H, 0.6), M.graphite));
  c.position.set(x, H / 2, z);
  room.add(c);
});

// потолок (антрацит) + 33 линии света
const ceiling = new THREE.Mesh(new THREE.BoxGeometry(W + 2 * T, 0.12, D + 2 * T), M.ceiling);
ceiling.position.y = H + 0.06;
shadowy(ceiling, true, false);
room.add(ceiling);
const ceilingParts = [ceiling];
{
  const duct = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, D), M.ceiling);
  duct.position.set(-1.2, H - 0.2, 0);
  room.add(duct);
  ceilingParts.push(duct);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, 0.35), M.ceiling);
  beam.position.set(0, H - 0.2, -0.8);
  room.add(beam);
  ceilingParts.push(beam);
}
const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.05, 0.07), M.bar, 33);
{
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let i = 0;
  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 3; c++) {
      const x = -3.6 + c * 3.6 + (rnd() - 0.5) * 1.2;
      const z = -4.6 + r * 0.92;
      e.set(0, (rnd() - 0.5) * 1.6, 0);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(x, H - 0.55 - rnd() * 0.15, z), q, new THREE.Vector3(1, 1, 1));
      bars.setMatrixAt(i++, m);
    }
  }
}
room.add(bars);

// вид из окна: Библиотека (фото с улицы)
const viewMat = new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false, alphaMap: edgeFade() });
new THREE.TextureLoader().load("assets/tex/view.jpg", (t) => {
  t.colorSpace = THREE.SRGBColorSpace;
  viewMat.map = t;
  viewMat.needsUpdate = true;
});
const view = new THREE.Mesh(new THREE.PlaneGeometry(34.4, 13.6), viewMat);
view.position.set(5.65, 6.5, -D / 2 - 14);
scene.add(view);
// земля под окнами (зал на 2 этаже) — видна только изнутри
const groundMat = new THREE.MeshBasicMaterial({ color: "#7d8070", transparent: true, opacity: 0 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -4.5, -D / 2 - 25);
scene.add(ground);
let viewK = 0;

/* ---------- свет ---------- */
const hemi = new THREE.HemisphereLight("#dfe7ef", "#7d6a50", 1.1);
scene.add(hemi);
const fill = new THREE.DirectionalLight("#ffffff", 0.35);
fill.position.set(6, 12, 10);
scene.add(fill);
const sun = new THREE.DirectionalLight("#fff3e2", 2.6);
sun.position.set(-3, 8, -16);
sun.target.position.set(0.5, 0, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 50 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);
const lamps = [-3, 3].map((x) => {
  const p = new THREE.PointLight("#fff6ea", 6, 14, 1.6);
  p.position.set(x, H - 0.8, 0);
  scene.add(p);
  return p;
});

/* ---------- мебель (instanced) ---------- */
function chairGeo() {
  const parts = [
    new THREE.BoxGeometry(0.46, 0.05, 0.44).translate(0, 0.46, 0),
    new THREE.BoxGeometry(0.46, 0.42, 0.04).translate(0, 0.7, 0.2),
  ];
  [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]].forEach(([x, z]) =>
    parts.push(new THREE.BoxGeometry(0.03, 0.46, 0.03).translate(x, 0.23, z))
  );
  return mergeGeometries(parts);
}
function tableGeo(w, d) {
  const parts = [new THREE.BoxGeometry(w, 0.04, d).translate(0, 0.75, 0)];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) =>
    parts.push(new THREE.BoxGeometry(0.05, 0.73, 0.05).translate(sx * (w / 2 - 0.1), 0.365, sz * (d / 2 - 0.1)))
  );
  return mergeGeometries(parts);
}
function roundTableGeo(r) {
  return mergeGeometries([
    new THREE.CylinderGeometry(r, r, 0.04, 40).translate(0, 0.75, 0),
    new THREE.CylinderGeometry(0.05, 0.05, 0.73, 12).translate(0, 0.365, 0),
    new THREE.CylinderGeometry(0.3, 0.3, 0.02, 24).translate(0, 0.01, 0),
  ]);
}
const CHAIR = chairGeo();

// chair spec: [x, z, rotY]; стул смотрит в −z при rotY = 0
function makeLayout(chairs, extras = []) {
  const g = new THREE.Group();
  const chairMat = new THREE.MeshStandardMaterial({ color: "#2b3238", roughness: 0.6, transparent: true, opacity: 0 });
  const im = shadowy(new THREE.InstancedMesh(CHAIR, chairMat, chairs.length));
  const base = chairs.map(([x, z, r]) => ({ x, z, r }));
  g.add(im);
  const extraMeshes = extras.map(({ geo, mat, x, z, y = 0, ry = 0 }) => {
    const m = shadowy(new THREE.Mesh(geo, mat.clone()));
    m.material.transparent = true;
    m.material.opacity = 0;
    m.position.set(x, y, z);
    m.rotation.y = ry;
    g.add(m);
    return m;
  });
  g.visible = false;
  room.add(g);
  const mats = [chairMat, ...extraMeshes.map((m) => m.material)];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), s = new THREE.Vector3();
  function pose(p) {
    const n = base.length;
    base.forEach((c, i) => {
      const t = THREE.MathUtils.clamp((p - (i / n) * 0.55) / 0.45, 0, 1);
      const e = 1 - Math.pow(1 - t, 3);
      q.setFromAxisAngle(up, c.r);
      s.setScalar(0.92 + 0.08 * e);
      m4.compose(new THREE.Vector3(c.x, (1 - e) * 0.5, c.z), q, s);
      im.setMatrixAt(i, m4);
    });
    im.instanceMatrix.needsUpdate = true;
    extraMeshes.forEach((m) => (m.scale.y = 0.6 + 0.4 * THREE.MathUtils.clamp(p * 1.6, 0, 1)));
    const op = THREE.MathUtils.clamp(p * 2.2, 0, 1);
    mats.forEach((mt) => {
      mt.opacity = op;
      mt.transparent = op < 1;
      mt.depthWrite = op > 0.98;
    });
  }
  pose(0);
  return { g, pose, p: 0 };
}

const whiteMat = new THREE.MeshStandardMaterial({ color: "#f1ede6", roughness: 0.5 });
const layouts = {};
{
  // лекция: 6 рядов × 8, лицом к экрану на западной стене
  const ch = [];
  [-2, -1, 0, 1, 2, 3].forEach((x) => [0.6, 1.25, 1.9, 2.55].forEach((z) => { ch.push([x, z, Math.PI / 2]); ch.push([x, -z, Math.PI / 2]); }));
  const screenMat = new THREE.MeshBasicMaterial({ map: slideTexture(), toneMapped: false });
  layouts.lecture = makeLayout(ch, [
    { geo: new THREE.PlaneGeometry(3.6, 2.0), mat: screenMat, x: -W / 2 + 0.02, z: 0, y: 2.5, ry: Math.PI / 2 },
    { geo: new THREE.BoxGeometry(0.5, 1.1, 0.45).translate(0, 0.55, 0), mat: M.graphite, x: -4.2, z: -2.0 },
  ]);
}
{
  // общий стол: 11 + 11 + 2
  const ch = [];
  for (let i = 0; i < 11; i++) {
    const x = -3.5 + i * 0.7;
    ch.push([x, -0.6 - 1.05, Math.PI]);
    ch.push([x, -0.6 + 1.05, 0]);
  }
  ch.push([-4.45, -0.6, -Math.PI / 2], [4.45, -0.6, Math.PI / 2]);
  layouts.table = makeLayout(ch, [{ geo: tableGeo(8.2, 1.4), mat: whiteMat, x: 0, z: -0.6 }]);
}
{
  // группы: 6 круглых столов по 6
  const ch = [], ex = [];
  const tg = roundTableGeo(0.75);
  [-3, 0, 3].forEach((cx) => [-2.3, 1.5].forEach((cz) => {
    ex.push({ geo: tg, mat: whiteMat, x: cx, z: cz });
    for (let k = 0; k < 6; k++) {
      const f = (k / 6) * Math.PI * 2 + 0.3;
      ch.push([cx + Math.cos(f) * 1.2, cz + Math.sin(f) * 1.2, Math.PI / 2 - f]);
    }
  }));
  layouts.groups = makeLayout(ch, ex);
}

const INFO = {
  empty: ["Свободная планировка", "123 м²", "зал без мебели"],
  lecture: ["Лекция · рядами", "48 мест", "экран 3,6 м и проектор"],
  table: ["Общий стол", "24 места", "переговоры, ужин, воркшоп"],
  groups: ["Группы", "36 мест", "6 столов по 6 человек"],
};
let current = "empty";
function setLayout(name) {
  if (name === current) return;
  const prev = layouts[current];
  const next = layouts[name];
  current = name;
  const [l, c, n] = INFO[name];
  const info = document.querySelector(".room__info");
  const swap = () => {
    document.getElementById("roomInfoLabel").textContent = l;
    document.getElementById("roomInfoCap").textContent = c;
    document.getElementById("roomInfoNote").textContent = n;
  };
  if (gsap && !reduce) {
    gsap.timeline()
      .to(info, { opacity: 0, y: -6, filter: "blur(4px)", duration: 0.15, ease: "power2.in" })
      .add(swap)
      .to(info, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.35, ease: "expo.out" });
  } else swap();

  if (prev) {
    if (gsap && !reduce) gsap.to(prev, { p: 0, duration: 0.35, ease: "power2.in", onUpdate: () => prev.pose(prev.p), onComplete: () => (prev.g.visible = prev.p > 0) });
    else { prev.p = 0; prev.pose(0); prev.g.visible = false; }
  }
  if (next) {
    next.g.visible = true;
    if (gsap && !reduce) gsap.to(next, { p: 1, duration: 1.4, delay: prev ? 0.2 : 0, ease: "none", onUpdate: () => next.pose(next.p) });
    else { next.p = 1; next.pose(1); }
  }
  wake();
}
addEventListener("arka:layout", (e) => setLayout(e.detail));

/* ---------- день / закат ---------- */
const DAY = { sun: "#fff3e2", sunI: 2.6, sx: -3, sy: 8, sz: -16, hemi: 1.1, exp: 1.0, view: "#ffffff", lamp: 6 };
const DUSK = { sun: "#ff9a52", sunI: 4.2, sx: -11, sy: 3.2, sz: -15, hemi: 0.45, exp: 1.05, view: "#ffc596", lamp: 10 };
const mood = { k: 0 };
const cA = new THREE.Color(), cB = new THREE.Color();
function applyMood() {
  const k = mood.k, L = THREE.MathUtils.lerp;
  sun.color.copy(cA.set(DAY.sun).lerp(cB.set(DUSK.sun), k));
  sun.intensity = L(DAY.sunI, DUSK.sunI, k);
  sun.position.set(L(DAY.sx, DUSK.sx, k), L(DAY.sy, DUSK.sy, k), L(DAY.sz, DUSK.sz, k));
  hemi.intensity = L(DAY.hemi, DUSK.hemi, k);
  renderer.toneMappingExposure = L(DAY.exp, DUSK.exp, k);
  viewMat.color.copy(cA.set(DAY.view).lerp(cB.set(DUSK.view), k));
  lamps.forEach((p) => (p.intensity = L(DAY.lamp, DUSK.lamp, k)));
}
applyMood();
const sunBtn = document.getElementById("sunToggle");
sunBtn.addEventListener("click", () => {
  const on = sunBtn.getAttribute("aria-pressed") !== "true";
  sunBtn.setAttribute("aria-pressed", String(on));
  sunBtn.setAttribute("aria-label", on ? "День" : "Закат");
  if (gsap && !reduce) gsap.to(mood, { k: on ? 1 : 0, duration: 1.6, ease: "power2.inOut", onUpdate: applyMood });
  else { mood.k = on ? 1 : 0; applyMood(); }
  wake();
});

/* ---------- взгляд изнутри ---------- */
let inside = false;
const eyeBtn = document.getElementById("eyeToggle");
const EYE = { pos: new THREE.Vector3(-0.4, 1.65, 4.6), look: new THREE.Vector3(1.2, 2.1, -5.6) };
function flyTo(pos, target, done) {
  const from = { p: camera.position.clone(), t: controls.target.clone() };
  const o = { k: 0 };
  const step = () => {
    camera.position.lerpVectors(from.p, pos, o.k);
    controls.target.lerpVectors(from.t, target, o.k);
  };
  if (gsap && !reduce) gsap.to(o, { k: 1, duration: 1.5, ease: "power3.inOut", onUpdate: step, onComplete: done });
  else { o.k = 1; step(); done && done(); }
}
eyeBtn.addEventListener("click", () => {
  inside = !inside;
  eyeBtn.setAttribute("aria-pressed", String(inside));
  eyeBtn.setAttribute("aria-label", inside ? "Вернуться к обзору" : "Встать внутри зала");
  controls.autoRotate = false;
  controls.enableZoom = false;
  if (inside) {
    const dir = EYE.look.clone().sub(EYE.pos).normalize();
    controls.minDistance = 0;
    controls.maxPolarAngle = Math.PI - 0.3;
    flyTo(EYE.pos, EYE.pos.clone().add(dir.multiplyScalar(0.6)), () => {
      controls.minDistance = controls.maxDistance = 0.6;
    });
    controls.rotateSpeed = -0.35; // «оглядеться»: тянем сцену, а не камеру
  } else {
    controls.minDistance = 0;
    controls.maxDistance = 32;
    controls.rotateSpeed = 0.55;
    flyTo(HOME.pos, HOME.target, () => {
      controls.minDistance = 7;
      controls.maxPolarAngle = 1.48;
    });
  }
  wake();
});

/* ---------- срез стен, обращённых к камере ---------- */
const wallState = new Map();
let ceilV = 1;
walls.forEach((w) => {
  const mats = [];
  const own = new Map();
  w.group.traverse((o) => {
    if (!o.isMesh) return;
    if (!own.has(o.material)) own.set(o.material, o.material.clone());
    o.material = own.get(o.material);
    mats.push(o.material);
  });
  wallState.set(w, { v: 1, mats: [...new Set(mats)].map((m) => ({ m, op: m.opacity, tr: m.transparent, dw: m.depthWrite })) });
});
const tmp = new THREE.Vector3();
function cutaway(dt) {
  walls.forEach((w) => {
    const st = wallState.get(w);
    const outside = tmp.copy(camera.position).sub(w.c).dot(w.n) > 0.3;
    const goal = outside ? 0 : 1;
    st.v += (goal - st.v) * Math.min(1, dt * 7);
    if (Math.abs(goal - st.v) < 0.002) st.v = goal;
    st.mats.forEach(({ m, op, tr, dw }) => {
      if (st.v >= 1) { m.opacity = op; m.transparent = tr; m.depthWrite = dw; m.colorWrite = true; }
      else {
        m.transparent = true;
        m.opacity = op * st.v;
        m.depthWrite = false;
        m.colorWrite = st.v > 0.01; // тень от стены остаётся, даже когда её не видно
      }
    });
  });
  // потолок и светильники исчезают вместе, когда смотрим сверху
  const above = camera.position.y > H - 0.2;
  ceilV += ((above ? 0 : 1) - ceilV) * Math.min(1, dt * 7);
  if (Math.abs((above ? 0 : 1) - ceilV) < 0.002) ceilV = above ? 0 : 1;
  const solid = ceilV >= 1;
  [M.ceiling, M.bar].forEach((m) => {
    m.transparent = !solid;
    m.opacity = ceilV;
    m.depthWrite = solid;
    m.colorWrite = ceilV > 0.01; // потолок продолжает отбрасывать тень — свет на полу не прыгает
  });
  viewK += ((inside ? 1 : 0) - viewK) * Math.min(1, dt * 4);
  viewMat.opacity = viewK;
  groundMat.opacity = viewK;
  view.visible = ground.visible = viewK > 0.01;

}

/* ---------- подписи к точкам ---------- */
const TAGS = [
  { el: document.querySelector('[data-tag="window"]'), p: new THREE.Vector3(2.3, 4.45, -D / 2) },
  { el: document.querySelector('[data-tag="ceiling"]'), p: new THREE.Vector3(-W / 2, H, D / 2) },
  { el: document.querySelector('[data-tag="lib"]'), p: new THREE.Vector3(6.0, 3.8, -D / 2 - 14) },
];
const proj = new THREE.Vector3();
function placeTags() {
  const w = stage.clientWidth, h = stage.clientHeight;
  TAGS.forEach(({ el, p }) => {
    proj.copy(p).project(camera);
    const vis = proj.z < 1 && Math.abs(proj.x) < 0.92 && Math.abs(proj.y) < 0.85;
    const tag = el.dataset.tag;
    el.classList.toggle("is-off", !vis || (inside ? tag === "ceiling" : tag === "lib"));
    el.style.transform = `translate(${((proj.x + 1) / 2) * w - 15}px, ${((1 - proj.y) / 2) * h - 15}px)`;
  });
}

/* ---------- цикл: рендерим только когда секция видна ---------- */
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < 700 ? 46 : 32;
  camera.updateProjectionMatrix();
}
new ResizeObserver(() => { resize(); wake(); }).observe(stage);
resize();

let running = false, visible = false, last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  controls.update();
  cutaway(dt);
  placeTags();
  renderer.render(scene, camera);
  if (visible) requestAnimationFrame(frame);
  else running = false;
}
function wake() {
  if (!running && visible) {
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
}
let introDone = false;
new IntersectionObserver(([e]) => {
  visible = e.isIntersecting;
  if (visible) {
    wake();
    if (!introDone && gsap && !reduce) {
      introDone = true;
      const far = HOME.pos.clone().multiplyScalar(1.45).setY(19);
      camera.position.copy(far);
      flyTo(HOME.pos, HOME.target);
    }
  }
}, { threshold: 0.05 }).observe(stage);
