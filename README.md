# AI Engineering from Scratch — 3D Reading Edition

A static reading edition of [**AI Engineering from Scratch**](https://github.com/rohitg00/ai-engineering-from-scratch)
by [Rohit Ghumare](https://github.com/rohitg00): 20 phases, 523 lessons, ~684,000 words, rebuilt
as a website you can actually finish.

**Live:** https://raghavganesh7.github.io/ai-engineering-from-scratch-3d

The text is the author's, reproduced unmodified under its MIT licence. What is new here is the
reading experience: one page per lesson, a real table of contents, search across everything,
progress that survives a refresh, and enough 3D to make the structure memorable.

## What it does

- **One page per lesson** — 523 of them, with a sticky phase index, a live outline that tracks
  your scroll position, reading times from real word counts, and prev/next paging.
- **Search across the whole curriculum** (<kbd>⌘K</kbd> or <kbd>/</kbd>), ranked heading-first so
  you land on the section, not the top of the page.
- **The author's interactive figures, intact.** The upstream repo ships 556 hand-built animated
  SVG widgets; this edition carries the runtime verbatim and lazy-loads only the bundles a page
  needs. They re-colour with the phase accent and follow the light/dark theme.
- **390 mermaid diagrams**, rendered client-side and re-drawn when you flip the theme.
- **Progress tracking** in local storage — never uploaded, and clearable from the footer.
- **Keyboard-first**: `[` `]` page, `c` contents, `m` mark read, `t` theme, `?` for the rest.
- **No framework, no router, no trackers.** Plain HTML/CSS/JS, two build dependencies.

## Design

Brutalist: hard 2px edges, offset shadows, zero border-radius, one accent colour per phase driving
its cover, buttons, nav marker, progress bar and figures. Three uses of 3D, and no more: a Three.js
hero that draws a layered network with a pulse running forward and back through it (a forward pass,
then backprop), each phase as a CSS-3D cover object, and a slight tilt on interactive tiles. Never
on prose — body text is a 70-character measure of Literata and nothing competes with it.

## Build

```bash
npm install
npm run build      # content/ -> docs/
npm run check      # dead links, dead anchors, template leaks, search-index anchors
npm run serve      # docs/ on :8787
npm run shots      # screenshot matrix -> .shots/ (needs Chromium)
npm run diagrams   # render every mermaid diagram and fail on any that won't draw
```

`docs/` is committed and served by GitHub Pages; CI fails if it is stale.

### Re-importing upstream content

```bash
git clone --depth 1 https://github.com/rohitg00/ai-engineering-from-scratch /tmp/aifs
node tools/prepare_content.mjs /tmp/aifs   # flattens phases/ + copies the figure runtime
node tools/gen_catalog.mjs                 # regenerates build/catalog.mjs from the phase list
npm run build
```

Upstream stores a lesson as `phases/<phase>/<lesson>/docs/en.md`; `prepare_content.mjs` flattens
that to `content/<phase>/<lesson>.md`, rewrites cross-lesson links and per-lesson image paths, and
builds the figure-id → provider-bundle manifest by executing each bundle against a stub runtime.

## Layout

```
content/           the author's markdown, verbatim (+ figure SVGs)
build/
  catalog.mjs      generated: site identity + the 20-phase syllabus
  render.mjs       markdown -> HTML (Prism, figures, mermaid, heading ids, link rewriting)
  pages.mjs        page shells: landing, phase, lesson, plain
  build.mjs        measures content, writes docs/, search index, sitemap, 404
src/assets/        styles.css, app.js, hero.js, figures/ (the author's figure runtime)
tools/             prepare_content, gen_catalog, check_site, check_diagrams, shots
docs/              build output — committed, served by Pages
```

## Credit and licence

The curriculum — every lesson, diagram and figure — is by **Rohit Ghumare**, licensed
[MIT](https://github.com/rohitg00/ai-engineering-from-scratch/blob/main/LICENSE), and is
reproduced here unmodified. The author's own site, with quizzes, certification tracks and
translations that this edition does not reproduce, is at
[aiengineeringfromscratch.com](https://aiengineeringfromscratch.com). If this material is useful
to you, [star the upstream repository](https://github.com/rohitg00/ai-engineering-from-scratch).

The site code — build pipeline, styles, reader interactions — is MIT licensed. See `LICENSE` for
the split.
