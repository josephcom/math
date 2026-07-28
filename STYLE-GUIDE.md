# Math Book — Instructions for Writing the Next Chapter

You are Claude, continuing an interactive math book. Chapter 1 ("Set Theory & Logic",
`chapter-01-set-theory-and-logic.html`) is the reference implementation. **Match it exactly.**
Read this whole file, then open Chapter 1's HTML and mirror its structure.

---

## 1. The Book's Concept (agreed with the reader)

- The book presents mathematics as a **logical dependency chain / tower**: each chapter is a
  topic broken into **layers**, ordered bottom-up so that every layer uses only earlier layers
  (and earlier chapters).
- Within each layer, content is grouped into the reader's agreed "building blocks", used as
  `<h3>` section headings, in roughly this order (include only the ones that apply):
  1. Concepts & Definitions
  2. Axioms / Postulates
  3. Propositions
  4. Lemmas
  5. Theorems (with Corollaries listed right after the theorem they follow from)
  6. Methods / Algorithms
- Conjectures are NOT takeaways (they're unproven) — only mention one if it is famous and
  educational (e.g., Continuum Hypothesis), and clearly label its status.
- Every chapter ends with a **"Methods Toolbox"** recap section (`id="SUM"`): a table with
  columns Method | Layer | Use.

## 2. Communication Style (reader's standing preference)

- **Simple layman language.** Sharp, concise, to the point — but never at the cost of
  accuracy or completeness.
- Each list item = **bold term** + em-dash + one-line plain description. Standard math
  notation in the term/description where natural.
- Tone: friendly, vivid, occasionally playful ("meet 2", "three costumes, one actor"),
  never rambling.

## 3. The Example System (the heart of the book)

- **Every `<li>` gets a hidden example. No item goes without one** unless truly inapplicable.
- Examples must be: **short, dead-simple, layman, everyday-life** (tea/coffee, birthdays,
  dominoes, socks, guest lists, chairs...). As short as possible while still landing.
- An example may contain small math (KaTeX) when it clarifies, but everyday analogies come first.
- Exact required markup for every item (the JS and CSS depend on it):

```html
<li><b>Term</b> — one-line description, math as \(...\).
  <div class="ex"><div><p>Short everyday example here.</p></div></div></li>
```

- Do not change this nesting: `.ex > div > p` (the outer grid + inner overflow wrapper make
  the slide animation work).

## 4. The Proof System (companion to the examples)

- **Every item stating a provable result — theorems, propositions, lemmas, corollaries,
  derived inference rules — gets a second hidden box with its formal proof/derivation**,
  placed immediately after the example box. Definitions, axioms, primitive inference
  rules, and methods get none.
- Proofs are formal but compact: real derivations in KaTeX, a few lines each, ending
  with \(\blacksquare\). Cite earlier layers by name ("Layer 1's De Morgan", "Extensionality").
- Results whose full proofs are beyond the book's scope (Zorn, Gödel, CH, CSB…) get an
  honest **proof sketch** — start the text with "Sketch:".
- Exact required markup (CSS auto-inserts the bold "Proof" label; both boxes slide open
  together on the same click — the shared CSS/JS already handle it):

```html
<li><b>Term</b> — one-line description.
  <div class="ex"><div><p>Short everyday example.</p></div></div>
  <div class="proof"><div><p>Formal derivation. \(\blacksquare\)</p></div></div></li>
```

- Same nesting rule as `.ex`: `.proof > div > p`, `.proof` directly after `.ex`.

## 5. The Notes System (automatic — nothing to write)

- Every heading (`h1`, `h2.ltitle`, `h3`) and every list item also carries a **third
  box: the reader's own note**, built at runtime by `notes.js`. There is **no markup
  to author** — do not hand-write note boxes, and do not add ids for them.
- It is amber (the book's one warm accent) so a note is never mistaken for the text.
  A pencil `✎` sits at the right of every heading and item; filled = a note exists.
- It **slides with the example and the proof**: one click on the item reveals all
  three, clicking elsewhere closes all three. A heading holding a note is clickable
  the same way. The pencil is the *write* affordance — it reveals the note and drops
  into edit mode when the note is empty or already open. The single exception to the
  reveal contract: while a note is being edited, its item will not close.
- The raw text is Markdown + LaTeX, so a Claude answer can be pasted in unchanged.
  Edit mode shows the raw text, view mode the render. Notes live in the reader's
  `localStorage`, keyed per page and per anchor — never in the repo.
- `sync.js` carries them between browsers and machines through one **secret gist**
  (`math-notes.json`, the whole book in one file), merging per note by timestamp.
  The chip at the bottom right shows the state. The token is entered there by the
  reader and stays in that browser: **never write a token into a file, and never
  commit one** — this repo is public.
- Anchor ids are derived from the wording (`i:L3:power-set`, `h:L4:the-zfc-axioms`).
  **Rewording a term or a heading orphans its note.** When editing an existing
  chapter, prefer leaving `<b>` terms and `<h3>` headings alone.
- The one thing a chapter must do is keep the three scripts in the head, in this order:

```html
<script defer src="script.js"></script>
<script defer src="notes.js"></script>
<script defer src="sync.js"></script>
```

## 6. Math Notation

- **All math is LaTeX rendered by KaTeX.** Inline: `\( ... \)`. Display: `\[ ... \]`.
- Never use raw Unicode math where a LaTeX macro exists: `\forall, \exists, \neg, \land,
  \lor, \to, \leftrightarrow, \equiv, \in, \notin, \varnothing, \subseteq, \subsetneq,
  \cup, \cap, \setminus, \mathcal{P}(A), \mathbb{N}, \mathbb{Z}, \mathbb{Q}, \mathbb{R},
  \mathbb{C}, \aleph_0, \mathfrak{c}, \iff, \implies, \frac{a}{b}` etc.
  (Lone symbols inside plain prose sentences, like "⊆" in an example, are tolerated but
  prefer KaTeX.)
- Escape `<` as `&lt;` inside formulas in HTML.
- Keep the exact KaTeX CDN block from Chapter 1's `<head>` (stylesheet + katex.min.js +
  auto-render with `\(`/`\[` delimiters).

## 7. Files & Page Skeleton

- Shared files, **do not duplicate their contents inline**:
  - `style.css` — all styling. Link it. Do not edit unless the reader asks.
  - `script.js` — the click-to-reveal behavior. Link it with `defer`.
  - `notes.js` — the reader's note boxes (§5). Link it with `defer`, after `script.js`.
  - `sync.js` — gist sync for those notes (§5). Link it with `defer`, after `notes.js`.
  - Each chapter: `chapter-NN-topic-name.html`.
- Page skeleton (copy from Chapter 1):
  1. `<header>`: `<h1>` chapter title + `.topnav` with an outlined back-button
     (`❮ Previous Chapter` linking to the previous chapter file) and a green
     `Start Learning ❯` button linking to `#L1`.
  2. `.intro` two-panel card: left white pane = what this chapter is and why it matters
     (3 short paragraphs + green button); right `.mint` pane = "How to Use This Page"
     (keep the tap-to-reveal explanation, and the line about the ✎ note box).
  3. `.chips` nav: one pill per layer (`#L1`, `#L2`, ...) + `#SUM` Toolbox.
  4. One `<section class="layer" id="LN">` per layer, each containing:
     `<span class="chapter">Layer N · short nickname</span>`, `<h2 class="ltitle">`,
     `<p class="ldesc">` (one italic line), then the `<h3>` block groups with `<ul>` lists.
  5. Recap `<section class="layer" id="SUM">` with the methods `<table>`.
  6. `<footer>`: green Back-to-Top button + one-line tagline.

## 8. Design Rules (already encoded in style.css — just don't fight them)

- W3Schools-inspired: white page, green `#04AA6D` accent, mint panels, bordered rounded
  cards, Source Sans 3.
- Base font size is 24px (150% of default) via `html{font-size:24px}` — size everything in
  rem; never hardcode smaller pixel fonts.
- Example boxes: mint background, **2px dashed green border**, bold "Example" label
  (auto-inserted by CSS `::before`) — sliding open/closed via the grid-rows transition.
- Proof boxes: white background, **2px solid green border**, bold "Proof" label
  (auto-inserted) — same slide, opens together with the example on the same click.
- Note boxes: warm `--note-bg` amber, **2px solid amber border**, "Note" label — same
  slide, opening with the example and the proof on the same click.
- Interaction contract (already in script.js): click opens; clicking another item swaps;
  clicking elsewhere closes; clicking inside an open box keeps it open; an item whose
  note is being edited does not close.
- Respect `prefers-reduced-motion` (handled in CSS).

## 9. Content Quality Bar

- **Completeness over brevity of coverage**: list all standard definitions, axioms,
  propositions, lemmas, theorems, corollaries, and methods for the topic — but each entry
  itself stays one line.
- Order layers strictly by logical dependency (state prerequisites from earlier chapters
  in the intro pane instead of re-teaching them).
- Prefer named, standard results with their standard names.
- Accuracy is non-negotiable; when a result depends on the Axiom of Choice or is
  independent of ZFC, say so.

## 10. Delivery

- Deliver the chapter as an HTML file that works by dropping it into the same folder as
  `style.css`, `script.js` and `notes.js`. If the reader asks for a bundle, zip all
  files together.
- CDN note: KaTeX and Google Fonts load from the internet; keep that head block intact.

**Checklist before delivering:** every li has an example ✅ · exact `.ex` markup ✅ ·
every theorem/proposition/lemma/corollary has a `.proof` box right after its `.ex` ✅ ·
all math in KaTeX ✅ · chips match layer ids ✅ · toolbox table present ✅ ·
external css/js linked, nothing inlined ✅ · `script.js`, `notes.js` and `sync.js` all
linked with `defer`, in that order ✅ · no hand-written note markup ✅ ·
no token anywhere in the repo ✅
