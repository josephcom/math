# Journal

Append newest entries at the bottom. One short entry per working session:
what changed, and anything a future Claude would be surprised by.

---

## 2026-07-25 — Chapter 1 exists; site put online

**State before:** three loose files in a OneDrive folder —
`chapter-01-set-theory-and-logic.html` (11 layers, complete),
`style.css`, `script.js`, plus `STYLE-GUIDE.md`. Not a git repo, not online.

**Done this session:**
- Decided the multi-lesson navigation question. Chose a **landing page driven by
  a data file** over a hand-maintained TOC: `index.html` renders one card per
  chapter from the `CHAPTERS` array in `chapters.js`. Adding a lesson = adding
  one line. Entries with `file: null` render as greyed "Coming soon" cards.
- Added `index.html` and `chapters.js`.
- Added a `.ch* / .chlist / .chnote` block to `style.css` for the index cards.
  Nothing else in the stylesheet was touched.
- Chapter 1's dead `❮ Foundations` span became a real `❮ All Chapters` link to
  `index.html`.
- Wrote `CLAUDE.md` (project brief for future sessions) and this journal.
- `git init` on `main`, `.gitignore` excluding the `internal-not to be used by
  Claude/` folder, first commit, pushed to the public repo `josephcom/math`,
  enabled GitHub Pages from `main` / root.

**Live at:** https://josephcom.github.io/math/

**Open items:** none. Chapter 2's topic is undecided.

---

## 2026-07-25 (later) — Proof boxes added

Joseph asked for a second sliding box, right after each example box, holding the
**formal proof/derivation** of any item that needs one (theorems, propositions,
lemmas, corollaries, derived inference rules — not definitions, axioms, or methods).

**Done this session:**
- New `.proof` component in `style.css`: white background, 2px **solid** green
  border (vs. the example's dashed), auto-inserted bold "Proof" label, same
  grid-rows slide. Opens together with the example on the same click.
- One-word change in `script.js`: clicks inside `.proof` no longer close the item.
- Added ~64 proof boxes across all 11 layers of Chapter 1. Short formal
  derivations in KaTeX ending with \(\blacksquare\); deep results (CSB, Zorn,
  Gödel, CH) got honest sketches starting with "Sketch:".
- Chapter 1's "How to Use This Page" pane now mentions the proof box.
- STYLE-GUIDE.md: new §4 "The Proof System" (markup, scope, sketch rule);
  later sections renumbered 5–9; design rules + checklist updated.
- CLAUDE.md standing preferences updated.

**Surprise for future Claude:** nothing extra to wire per chapter — the same
`li.on` class drives both boxes; just emit `.proof` markup after `.ex`.
