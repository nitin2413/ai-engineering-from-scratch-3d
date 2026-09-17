/**
 * Writes build/catalog.mjs from tools/.phases.json (produced by prepare_content.mjs)
 * plus the hand-written copy below. Re-run it only when the upstream phase list
 * changes; the generated file is the one that ships.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const phases = JSON.parse(fs.readFileSync(path.join(root, "tools", ".phases.json"), "utf8"));

// slug -> everything a machine cannot infer: colour, and prose about the phase.
const COPY = {
  "setup-and-tooling": {
    accent: "#FFE500", ink: "#111111",
    blurb: "Python, Node, Rust and CUDA installed once, properly, so that no later lesson turns into a fight with your own machine.",
  },
  "math-foundations": {
    accent: "#4D5BFF", ink: "#FFFFFF",
    blurb: "Linear algebra, calculus, probability and information theory — each one derived in code you run, not proofs you skim.",
  },
  "ml-fundamentals": {
    accent: "#00D4A0", ink: "#111111",
    blurb: "Regression, trees, clustering and the evaluation discipline that still decides whether a production model actually works.",
  },
  "deep-learning-core": {
    accent: "#FF4FA3", ink: "#111111",
    blurb: "Backpropagation, optimizers, regularization and training loops — hand-built before any framework is allowed in the room.",
  },
  "computer-vision": {
    accent: "#FF6B1A", ink: "#111111",
    blurb: "Convolutions through vision transformers: detection, segmentation, video and 3D. Pixels turned into decisions.",
  },
  "nlp-foundations-to-advanced": {
    accent: "#B8FF3C", ink: "#111111",
    blurb: "Tokenizers, embeddings, language models and retrieval, from counting n-grams to modern hybrid semantic search.",
  },
  "speech-and-audio": {
    accent: "#00C2FF", ink: "#111111",
    blurb: "Signal processing, speech recognition, synthesis, diarization and real-time voice agents that can hold a turn.",
  },
  "transformers-deep-dive": {
    accent: "#9B5CFF", ink: "#FFFFFF",
    blurb: "Attention, positional encodings, normalization and KV caches — every block of the architecture, one layer at a time.",
  },
  "generative-ai": {
    accent: "#FF2D55", ink: "#FFFFFF",
    blurb: "Diffusion, VAEs, GANs and flow matching across image, video, audio and 3D generation.",
  },
  "reinforcement-learning": {
    accent: "#FFB800", ink: "#111111",
    blurb: "Bandits, value and policy methods, PPO — and the RLHF pipeline that turns a base model into an assistant.",
  },
  "llms-from-scratch": {
    accent: "#6C4DFF", ink: "#FFFFFF",
    blurb: "Data, tokenizer, architecture, training run, fine-tuning and quantization: a language model you built end to end.",
  },
  "llm-engineering": {
    accent: "#00E0C6", ink: "#111111",
    blurb: "Prompting, structured output, RAG, evaluation, caching and cost control for applications that have to ship.",
  },
  "multimodal-ai": {
    accent: "#FF8FB1", ink: "#111111",
    blurb: "Contrastive alignment, vision-language models, audio-visual reasoning and any-to-any architectures.",
  },
  "tools-and-protocols": {
    accent: "#C6FF00", ink: "#111111",
    blurb: "Function calling, MCP servers, sandboxes and the contracts that let a model touch real systems without breaking them.",
  },
  "agent-engineering": {
    accent: "#0091FF", ink: "#FFFFFF",
    blurb: "The agent loop, memory, planning, tool design, evaluation — and the failure modes that quietly break agents in production.",
  },
  "autonomous-systems": {
    accent: "#FF5C00", ink: "#FFFFFF",
    blurb: "Long-running agents: scheduling, budgets, self-monitoring, recovery, and the guardrails that keep them contained.",
  },
  "multi-agent-and-swarms": {
    accent: "#7CFFB2", ink: "#111111",
    blurb: "Delegation, negotiation, shared memory, consensus, and the emergent behaviour of agents working in groups.",
  },
  "infrastructure-and-production": {
    accent: "#C79BFF", ink: "#111111",
    blurb: "Serving, scaling, GPU economics, observability and CI — the operational spine underneath every AI product.",
  },
  "ethics-safety-alignment": {
    accent: "#E0005A", ink: "#FFFFFF",
    blurb: "Bias, red-teaming, interpretability, privacy and governance, up to the safety case you have to be able to make out loud.",
  },
  "capstone-projects": {
    accent: "#00FF85", ink: "#111111",
    blurb: "Portfolio-grade builds. Each one is an end-to-end system that exercises whole phases at once.",
  },
};

const modules = phases.map((p) => {
  const copy = COPY[p.slug];
  if (!copy) throw new Error(`no copy for phase ${p.slug}`);
  return {
    slug: p.slug,
    num: p.num,
    title: p.title,
    subtitle: p.epigraph,
    blurb: copy.blurb,
    accent: copy.accent,
    accentInk: copy.ink,
    files: p.lessons,
  };
});

const j = (v) => JSON.stringify(v);
const moduleSrc = modules
  .map(
    (m) => `  {
    slug: ${j(m.slug)},
    num: ${m.num},
    title: ${j(m.title)},
    subtitle: ${j(m.subtitle)},
    blurb: ${j(m.blurb)},
    accent: ${j(m.accent)},
    accentInk: ${j(m.accentInk)},
    files: [
${m.files.map((f) => `      ${j(f)},`).join("\n")}
    ],
  },`,
  )
  .join("\n");

const src = `/**
 * GENERATED by tools/gen_catalog.mjs — edit the copy there, not here.
 *
 * SITE is the identity of this edition; MODULES is the syllabus: one entry per
 * upstream phase, its lessons in reading order, and the accent that colours its
 * cover, buttons, nav marker and figures.
 */

export const SITE = {
  title: "AI Engineering from Scratch",
  shortTitle: "AIFS",
  tagline: "A 523-lesson curriculum that builds modern AI by hand, from tensors to autonomous agents.",
  badge: "AI",
  wordmark: "AI <em>FROM SCRATCH</em>",
  coverEyebrow: "AI Engineering<br>from Scratch",
  edition: "3D Reading Edition",

  author: "Rohit Ghumare",
  authorUrl: "https://github.com/rohitg00",
  upstream: "https://github.com/rohitg00/ai-engineering-from-scratch",
  upstreamLabel: "rohitg00/ai-engineering-from-scratch",
  licence: { name: "MIT", url: "https://github.com/rohitg00/ai-engineering-from-scratch/blob/main/LICENSE" },
  support: [
    { label: "Star the repository", url: "https://github.com/rohitg00/ai-engineering-from-scratch" },
    { label: "The author's own site", url: "https://aiengineeringfromscratch.com" },
  ],

  repo: "https://github.com/RaghavGanesh7/ai-engineering-from-scratch-3d",
  baseUrl: "https://raghavganesh7.github.io/ai-engineering-from-scratch-3d",
  footerLine: "Free to read, forever",
  about:
    "**AI Engineering from Scratch** is Rohit Ghumare's open curriculum: 20 phases, 523 lessons, from installing a toolchain to shipping autonomous multi-agent systems. This site is an independent reading edition of it — the same words, the author's own interactive figures, rebuilt as a website you can actually finish.",

  unitLabel: "Phase",
  unitLabelPlural: "Phases",

  heroLines: ["BUILD", "AI", "FROM", "SCRATCH"],
  heroFillLine: 1,
  heroOutlineLine: 3,
  heroKicker: "",
  ticker: ["TENSORS", "BACKPROP", "ATTENTION", "DIFFUSION", "RLHF", "AGENTS", "MCP", "SWARMS", "ALIGNMENT"],

  seriesTitle: "Twenty Phases",
  seriesNote: "Start at Phase 00 and walk forward, or drop into the phase that matches what you are building this week.",
  conceptsTitle: "The four ideas the rest hangs on",
  ctaTitle: "Start where everyone starts.",
  ctaLine: "Phase 00 gets \`python\`, \`node\`, \`cargo\` and your GPU working. Everything after that is building.",
  concepts: [
    { name: "Build it by hand", body: "Every abstraction is written from scratch once — tokenizer, attention, optimizer — before a library is allowed to hide it.", module: "llms-from-scratch" },
    { name: "Attention is the engine", body: "One operation explains transformers, multimodal models and most of what agents can do.", module: "transformers-deep-dive" },
    { name: "The agent loop", body: "Model, tools, memory, control flow. Four parts, and every agent framework is a wrapper around them.", module: "agent-engineering" },
    { name: "Shipping is the exam", body: "Serving, cost, observability and safety are where AI projects actually fail.", module: "infrastructure-and-production" },
  ],

  pages: [],

  contentDir: "content",
  wpm: 220,
  dropBannerHeading: false,
  assetDirs: ["assets"],
};

export const MODULES = [
${moduleSrc}
];

/** Upstream material this edition deliberately does not reproduce. */
export const OMITTED = [
  { title: "Quizzes and certification tracks", note: "interactive, and scored on the author's own site" },
  { title: "Runnable code/ and outputs/ directories", note: "cloned from the upstream repository, not reproduced here" },
  { title: "Translations (12 languages)", note: "machine-translated upstream; this edition ships the canonical English" },
];
`;

fs.writeFileSync(path.join(root, "build", "catalog.mjs"), src);
console.log(`catalog.mjs: ${modules.length} modules · ${modules.reduce((a, m) => a + m.files.length, 0)} lessons`);
