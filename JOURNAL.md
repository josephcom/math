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
