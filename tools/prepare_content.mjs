/**
 * One-shot importer: upstream repo tree -> content/ + src/assets/figures/.
 *
 *   node tools/prepare_content.mjs <path-to-upstream-clone>
 *
 * The upstream repo stores a lesson as a directory:
 *   phases/<NN-phase>/<MM-lesson>/docs/en.md   (+ assets/*.svg, code/, quiz.json)
 * This flattens that into the one-file-per-lesson shape the build expects:
 *   content/<phase-slug>/<MM-lesson>.md        (+ assets/<MM-lesson>/*.svg)
 *
 * It also copies the upstream interactive-figure runtime (lesson-figures.js and
 * the figures-*.js provider bundles) and writes the id -> provider manifest the
 * runtime uses to lazy-load only the bundles a page actually needs.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = process.argv[2];
if (!SRC) {
  console.error("usage: node tools/prepare_content.mjs <path-to-upstream-clone>");
  process.exit(1);
}

const CONTENT = path.join(root, "content");
const FIGDIR = path.join(root, "src", "assets", "figures");
const read = (p) => fs.readFileSync(p, "utf8");
const dirs = (p) =>
  fs
    .readdirSync(p, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

// ---------------------------------------------------------------- lessons ---
fs.rmSync(CONTENT, { recursive: true, force: true });

const phases = [];
for (const phaseDir of dirs(path.join(SRC, "phases"))) {
  const slug = phaseDir.replace(/^\d+-/, "");
  const num = Number(phaseDir.slice(0, 2));
  const outDir = path.join(CONTENT, slug);
  const lessons = [];

  for (const lessonDir of dirs(path.join(SRC, "phases", phaseDir))) {
    const md = path.join(SRC, "phases", phaseDir, lessonDir, "docs", "en.md");
    if (!fs.existsSync(md)) continue;

    // ../assets/x.svg is relative to docs/en.md; namespace per lesson so two
    // lessons in one phase can both ship a "loop.svg".
    let body = read(md).replace(/\.\.\/assets\//g, `assets/${lessonDir}/`);

    // Cross-lesson links are written relative to docs/en.md, so a sibling lesson
    // is ../../<lesson>/ and one in another phase is ../../../<phase>/<lesson>/.
    // Both forms appear with and without the /docs/en.md suffix.
    const page = (l) => `${l}.html`;
    body = body
      .replace(/\.\.\/\.\.\/\.\.\/(\d+-[a-z0-9-]+)\/(\d+-[a-z0-9-]+)(?:\/docs\/en\.md|\/)?/g, (_, p, l) => `../${p.replace(/^\d+-/, "")}/${page(l)}`)
      .replace(/\.\.\/\.\.\/(\d+-[a-z0-9-]+)(?:\/docs\/en\.md|\/)?/g, (_, l) => page(l))
      .replace(/\.\.\/(\d+-[a-z0-9-]+)\/docs\/en\.md/g, (_, l) => page(l));

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `${lessonDir}.md`), body);

    const assets = path.join(SRC, "phases", phaseDir, lessonDir, "assets");
    if (fs.existsSync(assets)) {
      fs.cpSync(assets, path.join(outDir, "assets", lessonDir), { recursive: true });
    }
    lessons.push(lessonDir);
  }

  const readme = path.join(SRC, "phases", phaseDir, "README.md");
  const intro = fs.existsSync(readme) ? read(readme) : "";
  phases.push({
    dir: phaseDir,
    slug,
    num,
    lessons,
    title: (/^#\s+(?:Phase\s+\d+:\s*)?(.+)$/m.exec(intro) || [, slug])[1].trim(),
    epigraph: (/^>\s+(.+)$/m.exec(intro) || [, ""])[1].trim(),
  });
}

// --------------------------------------------------------------- figures ----
// Each figures-*.js bundle is an IIFE that ends with window.LF.register({...}).
// Run it against a stub window to learn exactly which ids it provides, rather
// than pattern-matching the source.
fs.rmSync(FIGDIR, { recursive: true, force: true });
fs.mkdirSync(FIGDIR, { recursive: true });

const siteDir = path.join(SRC, "site");
const bundles = fs
  .readdirSync(siteDir)
  .filter((f) => /^figures.*\.js$/.test(f))
  .sort();

const providersByFigure = {};
const stubNode = () => ({
  setAttribute() {}, removeAttribute() {}, appendChild() {}, addEventListener() {},
  style: {}, dataset: {}, classList: { add() {}, remove() {} },
  querySelector: () => null, querySelectorAll: () => [],
});

for (const file of bundles) {
  const captured = [];
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    Promise,
    Math,
    Date,
    JSON,
    document: {
      createElement: stubNode,
      createElementNS: stubNode,
      createTextNode: stubNode,
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener() {},
      head: stubNode(),
      body: stubNode(),
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.LF = { register: (obj) => captured.push(...Object.keys(obj)) };
  try {
    vm.runInNewContext(read(path.join(siteDir, file)), sandbox, { filename: file, timeout: 5000 });
  } catch (err) {
    console.warn(`  ! ${file}: ${err.message}`);
  }
  const ids = captured.length ? captured : Object.keys(sandbox.AIFS_FIGURES || {});
  for (const id of ids) (providersByFigure[id] ||= []).push(`figures/${file}`);
  fs.copyFileSync(path.join(siteDir, file), path.join(FIGDIR, file));
}

fs.copyFileSync(path.join(siteDir, "lesson-figures.js"), path.join(FIGDIR, "lesson-figures.js"));
fs.writeFileSync(
  path.join(FIGDIR, "manifest.json"),
  JSON.stringify({ providersByFigure, order: bundles.map((f) => `figures/${f}`) }),
);

// --------------------------------------------------------------- summary ----
const total = phases.reduce((a, p) => a + p.lessons.length, 0);
console.log(`content: ${phases.length} phases · ${total} lessons`);
console.log(`figures: ${bundles.length} provider bundles · ${Object.keys(providersByFigure).length} ids`);
fs.writeFileSync(path.join(root, "tools", ".phases.json"), JSON.stringify(phases, null, 2));
console.log("wrote tools/.phases.json (scratch input for catalog.mjs)");
