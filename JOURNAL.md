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

---

## 2026-07-28 — Free notes: a third box, Joseph's own

Joseph asked for a note box on **headings and list items** that he can add, edit,
delete and save, taking Markdown **and** LaTeX so a Claude answer can be pasted in
raw: edit mode shows the raw text, view mode the render.

**Done this session:**
- New file `notes.js` (~470 lines, no dependencies beyond the KaTeX the page already
  loads). Three parts: a localStorage layer, a small Markdown+LaTeX renderer, and the
  UI. Linked with `defer` after `script.js` in Chapter 1's head.
- A `✎` pencil is injected at the right of every `h1`, `h2.ltitle`, `h3` and every
  `.layer ul > li` — 210 of them in Chapter 1. Faint when empty, filled amber when a
  note exists. Panels are built lazily on first click, so the DOM stays light.
- Renderer: pulls fenced code, then math, then inline code into private-use sentinel
  placeholders **before** the Markdown pass, so `_`, `*` and `\` inside TeX are never
  chewed. Handles headings, bold/italic/strike, inline + fenced code, nested ordered
  and unordered lists, `- [ ]` task boxes, blockquotes, pipe tables with alignment,
  `---` rules, links (parens in URLs work), images. Math in all four delimiters:
  `$…$`, `$$…$$`, `\(…\)`, `\[…\]`, rendered with `katex.renderToString`.
  `$5 and $10` stays money (a `$…$` span whose content is space-padded is rejected).
  All user text is HTML-escaped and `javascript:` URLs are neutered.
- New amber `--note-*` component in `style.css` (2px solid amber vs. the example's
  dashed green and the proof's solid green) plus a full `.nview` reset — the book's
  global `ul{list-style:none}` / `li::before "+"` / `cursor:pointer` would otherwise
  leak into a note's own Markdown lists. `li` right padding went 14px → 46px to make
  room for the pencil.
- One-word change in `script.js`: clicks on `.note`/`.notebtn` don't toggle the item.
- Ctrl/Cmd+Enter saves, Escape cancels, textarea auto-grows to 62vh then scrolls,
  `beforeunload` warns on unsaved edits, saving an empty note deletes it.

**Surprises for future Claude:**
- A note's anchor id is derived from the wording — `i:L1:conjunction`,
  `h:L4:the-zfc-axioms`. **Rewording a `<b>` term or an `<h3>` heading orphans its
  note.** Duplicate labels inside one section get `~2`, `~3`.
- A note has its **own** open state, deliberately unlike `.ex`/`.proof`: clicking
  elsewhere closes the example but leaves the note open, or you'd lose what you typed.
  Opening a note does not open the example, and vice versa.
- Notes live only in the reader's browser, keyed by **file name + origin**. So notes
  written on `josephcom.github.io` are invisible when the same file is opened from
  OneDrive, and vice versa. Console escape hatch on every chapter page:
  `mathNotes.export()` → JSON, `mathNotes.import(json)` → merge back.
- Tested headless (Node harness over the renderer, 9 assertions + 16 fixtures) and in
  Chrome against a localhost copy: 10 KaTeX spans, table, nested lists, code block and
  task box all render; note survives reload; edit mode returns the raw text unchanged.

**Open items:** no export/import **UI** — it's console-only. If notes ever need to
travel between machines or be backed up, that's the next thing to build.

---

## 2026-07-28 (later) — Notes now slide with the example and the proof

Joseph's one correction after trying it: he expected the note to slide **exactly** like
the example and proof boxes. It had its own open state, deliberately, to protect
in-progress typing. Wrong call — reversed.

**Done this session:**
- A note with content is `.note.filled` and opens from `li.on`, same as `.ex`/`.proof`:
  one click on an item reveals all three, another item swaps, a click elsewhere closes
  all three. Verified `1/1/1 -> 0/0/0 -> 1/1/1` with the transitions settled.
- The typing protection survives as a narrow exception instead of a different model:
  `script.js` now refuses to close an item that contains a `.note.editing`, so a stray
  click can't yank the editor away. That is the only deviation from the reveal contract.
- The pencil became the *write* affordance: it reveals the note and drops into edit mode
  when the note is empty or already open. Empty notes never show a box on reveal, so 210
  blank boxes don't appear — `.filled` is what earns a slide.
- Headings have no `.on` of their own, so their note keeps the `.note.open` flag; a
  heading that holds a note now gets `.hasnote` (cursor pointer) and toggles on click,
  and a click elsewhere closes it. One heading note open at a time.
- `script.js` exports `window.revealItem(li)` so notes.js can open an item through the
  same one-at-a-time bookkeeping rather than setting `.on` behind its back.

---

## 2026-07-28 (later still) — Notes sync through a secret gist

Joseph hit the obvious wall: `localStorage` is per browser and per origin, so notes
didn't follow him to another browser or another PC. He'd already used the gist route on
another Pages project ("stack"), and chose it again: **secret gist, auto-discovered,
automatic sync**.

**Done this session:**
- New file `sync.js`. One gist file, `math-notes.json`, holds the **whole book**:
  `{ "<page.html>": { "<anchor-id>": {t,u} | {d:1,u} } }`. On first connect the page
  looks through the reader's gists for that filename and adopts it, else creates a
  secret gist — so a new browser needs the token and nothing else, no gist id to carry.
- Merge is **per note, newest `u` wins**, so two browsers can't clobber each other.
  Deletes travel as tombstones (`{d:1,u}`, swept after 90 days) instead of being undone
  by the other side. On an exact `u` tie, text beats a tombstone — losing writing is
  worse than a resurrected note. The identical rule lives in `notes.js`'s `absorb()`.
- Pull on load and on window focus (throttled to 60s), push ~1.2s after a save. Runs are
  serialized on one promise chain. `localStorage` stays the source of truth for reading;
  if GitHub is unreachable the notes keep working and the chip goes red.
- `notes.js` gained the storage API sync needs — `all()`, `absorb()`, `refresh()`,
  `onChange()` — and now writes tombstones instead of deleting keys.
- Sync chip, bottom right, built by `sync.js`: state at a glance, and the popover holds
  the token field, a link that pre-selects the `gist` scope, Sync now and Disconnect.

**Two real bugs the tests caught, worth remembering:**
- `replaceAll()` (as it was) blindly overwrote the page's notes with the snapshot the
  sync had started with. A note saved *during* a round trip was silently reverted. It is
  now `absorb()`, which never lets an incoming entry overwrite a newer local one, and
  `runOnce` re-reads local state *after* the pull. There is a regression test for this.
- `sync()` used to return early while another run was in flight, so its promise resolved
  before anything had happened — "Sync now" looked like a no-op. Runs are now queued.

**Surprises for future Claude:**
- Sync needs http(s). Opened from the disk (`file://`) GitHub refuses the request; the
  chip says so and notes still save locally.
- Timestamp merges trust the clock. A PC whose clock runs ahead will win conflicts for
  as long as it is ahead. Inherent to last-write-wins; not worth more machinery.
- **Never put a token in a file, never commit one, never ask for it in chat.** The repo
  is public. The token is typed into the chip and lives only in that browser.
- Tested with a stubbed GitHub API (15 assertions: create, pull, push, older/newer
  remote, tombstones, tie-break, cross-page delivery, mid-flight edit, idempotence) plus
  the real 401 path. The harness lives in the scratchpad, not the repo.
