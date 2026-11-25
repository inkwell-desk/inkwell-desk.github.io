# Inkwell — a calligraphy & journaling desk

A tactile stationery desk in your browser: pressure-sensitive pens on procedurally generated papers, guided calligraphy lessons with ghost-tracing and stroke scoring, and a daily journal with prompts, rubber stamps and wax seals. Every stroke is stored as a **vector** (position, pressure, tilt, timing) so any page can be replayed with **“Watch me write”**.

Live: https://kumarnikhildeveloperaccount.github.io/inkwell/

## Features
- **Pen engine** (canvas, Pointer Events): fountain pen, italic broad-edge nib (adjustable angle), pointed dip pen, sumi brush (ink load + dry-brush streaks, tilt splay), translucent marker (multiply layering), grainy pencil (tilt to shade), stroke eraser, hand/pan tool.
- Real stylus **pressure & tilt**; with a mouse or finger, pressure is simulated from **speed** (slow = heavy). Steadiness smoothing, stylus-only palm rejection, coalesced events for smooth lines.
- **Papers**: cotton rag, washi (kozo fibres), parchment, kraft — each with its own grain, fibres and **ink-bleed absorbency**. Rulings: lined, italic 5°, copperplate 55°, grid, dots.
- **Lessons**: Latin italic, Copperplate drills, Devanagari strokes, Japanese brush basics (一 二 三 十 人 大 永). Ghost guide rendered with the real pen engine, numbered start dots, direction arrows, “Watch the master” demo, memory mode, per-stroke scoring (shape, direction, stroke order) and best-score stars.
- **Journal**: a page per day, deterministic daily prompt (shuffle-able), month calendar, typed margin note, 9 stamps (one secret), wax seals with your monogram in 6 colours, “seal the page” (read-only until you break the seal — the crack stays).
- **Saving (IndexedDB)**: autosave after every stroke, library with thumbnails, duplicate/delete, replay any page; export **PNG (2×)**, **SVG** (strokes as real outline paths) and **.inkwell** JSON (re-importable, replayable); import with validation.
- Four themes: Midnight Ink, Ivory & Brass, Oxblood Leather, Sumi & Vermilion. Synthesized sounds (nib scratch per tool, stamp thunk, wax squish, page rustle, score chime) — off until you enable them.
- Keyboard: `1–8` tools, `[` `]` size, `Ctrl/⌘+Z` undo, `Shift` to redo, `P` replay, `Esc` cancel.

## Files
```
index.html  404.html  favicon.svg  manifest.webmanifest  README.md
css/base.css  css/desk.css  css/views.css
js/util.js  js/db.js  js/paper.js  js/engine.js  js/stamps.js  js/exporter.js  js/lessons.js  js/journal.js  js/app.js
```
No libraries, no CDNs, no web fonts, no network requests. 100% client-side.

## Limitations
- Pressure/tilt depend on the device and browser exposing them through Pointer Events; otherwise speed-based pressure is used.
- Lesson shapes are simplified practice guides, and scoring is geometric (shape, direction, order), not a judgement of pressure or style.
- In SVG exports, stamps and seals are embedded as images and paper grain is approximated with an SVG filter.
- If the browser blocks IndexedDB (some private modes), pages live in memory only — export to keep them.

Designed & built by **Kumar Nikhil** — [Portfolio](https://kumarnikhildeveloperaccount.github.io/) · [LinkedIn](https://www.linkedin.com/in/kumar-nikhil-1000a9192/) · [Email](mailto:nkashyapnikhilnk@gmail.com)

With gratitude to God — Om Namah Paarvati Pateh, Har Har Mahadev. May God bless you and everyone.
