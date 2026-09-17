/* Hero scene: a layered network with a signal running through it.
   Flat, line-first 3D so it reads as technical drafting, not as a game engine.
   The geometry is the subject: five layers of units, wired to the next layer,
   with a pulse that sweeps forward (a forward pass) and then back through the
   same wires in the accent colour (backprop). Everything is drawn in the
   theme's ink/accent, so it re-colours with the page. */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas = document.querySelector("[data-hero-canvas]");
if (canvas && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const cssVar = (name, fallback) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 13);

  const world = new THREE.Group();
  scene.add(world);

  const wireMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.3 });
  const edgeMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 });
  const accentMat = new THREE.MeshBasicMaterial();
  const inkMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.82 });

  function applyTheme() {
    const ink = new THREE.Color(cssVar("--ink", "#111111"));
    const accent = new THREE.Color(cssVar("--accent", "#ffe500"));
    wireMat.color = ink;
    edgeMat.color = ink;
    inkMat.color = ink;
    accentMat.color = accent;
  }
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // --- the network ---------------------------------------------------------
  const LAYERS = [3, 6, 6, 4, 2]; // units per layer: in -> hidden -> hidden -> out
  const GAP = 2.6; // distance between layers along z
  const SPREAD = 1.02; // distance between units inside a layer
  const unitGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const unitEdgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.305, 0.305, 0.305));

  const layers = LAYERS.map((count, li) => {
    const z = (li - (LAYERS.length - 1) / 2) * GAP;
    const cols = count > 3 ? 2 : 1;
    const rows = Math.ceil(count / cols);
    const units = [];
    for (let i = 0; i < count; i++) {
      const col = cols === 1 ? 0 : i % cols;
      const row = cols === 1 ? i : Math.floor(i / cols);
      const x = cols === 1 ? 0 : (col - (cols - 1) / 2) * SPREAD;
      const y = (row - (rows - 1) / 2) * SPREAD;
      const mesh = new THREE.Mesh(unitGeo, inkMat);
      mesh.position.set(x, y, z);
      world.add(mesh);
      const outline = new THREE.LineSegments(unitEdgeGeo, edgeMat);
      outline.position.copy(mesh.position);
      world.add(outline);
      units.push(mesh);
    }

    // a frame around each layer, so the stack reads as layers and not as a cloud
    const w = ((cols - 1) * SPREAD) / 2 + 0.62;
    const h = ((rows - 1) * SPREAD) / 2 + 0.62;
    const frame = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-w, -h, z), new THREE.Vector3(w, -h, z),
        new THREE.Vector3(w, h, z), new THREE.Vector3(-w, h, z),
      ]),
      wireMat,
    );
    world.add(frame);
    return { z, units, frame };
  });

  // wires: a sampled subset of the full bipartite mesh, or it reads as fog
  const wirePoints = [];
  for (let li = 0; li < layers.length - 1; li++) {
    for (const a of layers[li].units) {
      for (const b of layers[li + 1].units) {
        if (Math.random() > 0.55) continue;
        wirePoints.push(a.position.x, a.position.y, a.position.z, b.position.x, b.position.y, b.position.z);
      }
    }
  }
  const wireGeo = new THREE.BufferGeometry();
  wireGeo.setAttribute("position", new THREE.Float32BufferAttribute(wirePoints, 3));
  world.add(new THREE.LineSegments(wireGeo, wireMat));

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener(
    "pointermove",
    (e) => {
      pointer.tx = (e.clientX / innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / innerHeight - 0.5) * 2;
    },
    { passive: true },
  );

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // On wide screens the headline owns the left half, so the stack is pushed
    // right and scaled down until it clears the display type.
    camera.position.z = w < 760 ? 15 : 12.5;
    world.position.x = w < 900 ? 0 : 4.6;
    world.position.y = w < 900 ? 0 : -0.2;
    world.scale.setScalar(w < 900 ? 0.72 : 0.84);
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener("resize", resize);

  let visible = true;
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  }).observe(canvas);
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden && visible;
  });

  // One full cycle: the signal walks forward through the layers, then the error
  // walks back. PERIOD covers both passes.
  const PERIOD = 7;
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const t = clock.getElapsedTime();

    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    // a fixed three-quarter view: the stack runs away from the reader, so the
    // layers stay separated instead of collapsing into each other
    world.rotation.y = -1.02 + Math.sin(t * 0.12) * 0.1 + pointer.x * 0.2;
    world.rotation.x = 0.16 + Math.sin(t * 0.17) * 0.04 - pointer.y * 0.14;

    const phase = (t % PERIOD) / PERIOD;
    const forward = phase < 0.5;
    const sweep = forward ? phase * 2 : 1 - (phase - 0.5) * 2; // 0..1 along the stack
    const head = sweep * (layers.length - 1);

    layers.forEach((layer, li) => {
      const near = 1 - Math.min(1, Math.abs(li - head) * 1.15);
      const lit = near > 0.08;
      layer.units.forEach((unit, ui) => {
        // stagger units inside a layer so the pass ripples rather than blinks
        const local = Math.max(0, near - (ui % 3) * 0.06);
        unit.material = lit && local > 0.05 ? accentMat : inkMat;
        unit.scale.setScalar(1 + local * 0.75);
        unit.rotation.y = t * 0.35 + ui;
        unit.rotation.x = t * 0.22;
      });
    });

    // the whole stack leans into the direction the signal is travelling
    world.position.z = (forward ? -1 : 1) * Math.sin(phase * Math.PI * 2) * 0.35;

    renderer.render(scene, camera);
  });
}
