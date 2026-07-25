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

## 4. Math Notation

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

## 5. Files & Page Skeleton

- Three shared files, **do not duplicate their contents inline**:
  - `style.css` — all styling. Link it. Do not edit unless the reader asks.
  - `script.js` — the click-to-reveal behavior. Link it with `defer`.
  - Each chapter: `chapter-NN-topic-name.html`.
- Page skeleton (copy from Chapter 1):
  1. `<header>`: `<h1>` chapter title + `.topnav` with an outlined back-button
     (`❮ Previous Chapter` linking to the previous chapter file) and a green
     `Start Learning ❯` button linking to `#L1`.
  2. `.intro` two-panel card: left white pane = what this chapter is and why it matters
     (3 short paragraphs + green button); right `.mint` pane = "How to Use This Page"
     (keep the tap-to-reveal explanation).
  3. `.chips` nav: one pill per layer (`#L1`, `#L2`, ...) + `#SUM` Toolbox.
  4. One `<section class="layer" id="LN">` per layer, each containing:
     `<span class="chapter">Layer N · short nickname</span>`, `<h2 class="ltitle">`,
     `<p class="ldesc">` (one italic line), then the `<h3>` block groups with `<ul>` lists.
  5. Recap `<section class="layer" id="SUM">` with the methods `<table>`.
  6. `<footer>`: green Back-to-Top button + one-line tagline.

## 6. Design Rules (already encoded in style.css — just don't fight them)

- W3Schools-inspired: white page, green `#04AA6D` accent, mint panels, bordered rounded
  cards, Source Sans 3.
- Base font size is 24px (150% of default) via `html{font-size:24px}` — size everything in
  rem; never hardcode smaller pixel fonts.
- Example boxes: mint background, **2px dashed green border**, bold "Example" label
  (auto-inserted by CSS `::before`) — sliding open/closed via the grid-rows transition.
- Interaction contract (already in script.js): click opens; clicking another item swaps;
  clicking elsewhere closes; clicking inside an open example keeps it open.
- Respect `prefers-reduced-motion` (handled in CSS).

## 7. Content Quality Bar

- **Completeness over brevity of coverage**: list all standard definitions, axioms,
  propositions, lemmas, theorems, corollaries, and methods for the topic — but each entry
  itself stays one line.
- Order layers strictly by logical dependency (state prerequisites from earlier chapters
  in the intro pane instead of re-teaching them).
- Prefer named, standard results with their standard names.
- Accuracy is non-negotiable; when a result depends on the Axiom of Choice or is
  independent of ZFC, say so.

## 8. Delivery

- Deliver the chapter as an HTML file that works by dropping it into the same folder as
  `style.css` and `script.js`. If the reader asks for a bundle, zip all files together.
- CDN note: KaTeX and Google Fonts load from the internet; keep that head block intact.

**Checklist before delivering:** every li has an example ✅ · exact `.ex` markup ✅ ·
all math in KaTeX ✅ · chips match layer ids ✅ · toolbox table present ✅ ·
external css/js linked, nothing inlined ✅
