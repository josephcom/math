# Project: "math" — an interactive math book (GitHub Pages)

Read this first, then `STYLE-GUIDE.md` before writing or editing any chapter,
then `JOURNAL.md` for what has happened so far.

## What this is

A static, hand-written interactive math book. Mathematics presented as a
**logical dependency tower**: each chapter is a topic split into layers, each
layer using only earlier layers. Every list item hides a one-line everyday
example that slides open on click.

The reader is Joseph. Audience: himself and anyone he shares the link with.

## Live site

- Repo: `josephcom/math` (GitHub) — published with **GitHub Pages** from the
  `main` branch, root folder.
- URL: **https://josephcom.github.io/math/**
- Everything is plain static HTML/CSS/JS. No build step, no framework, no
  package manager. What is committed is exactly what is served.

## Files

| File | Role |
|---|---|
| `index.html` | Landing page / table of contents. Renders chapter cards from `chapters.js`. |
| `chapters.js` | **The chapter list.** Data array at the top, tiny renderer below. |
| `chapter-NN-topic-name.html` | One lesson per file. |
| `style.css` | All styling, shared by every page. |
| `script.js` | Click-to-reveal example behavior, shared by chapter pages. |
| `STYLE-GUIDE.md` | The full spec for writing a chapter. Non-negotiable. |
| `JOURNAL.md` | Session-by-session log. Append to it, newest last. |
| `internal-not to be used by Claude/` | Off-limits. Git-ignored. Do not read or commit. |

## Adding a new lesson (the routine)

1. Write `chapter-NN-topic-name.html` following `STYLE-GUIDE.md` exactly
   (copy Chapter 1's skeleton; the back-button in `.topnav` links to the
   previous chapter, or to `index.html` for Chapter 1).
2. Add **one object** to the `CHAPTERS` array in `chapters.js`. The index page
   updates itself — there is no TOC to hand-edit.
3. Append a line to `JOURNAL.md`.
4. Commit and push to `main`. Pages redeploys in ~1 minute.

## Publishing

Joseph will say "commit and push" (or similar). Do:

```bash
git add -A && git commit -m "Add chapter NN: <title>" && git push
```

Never commit the `internal-not to be used by Claude/` folder — `.gitignore`
already excludes it, keep it that way.

## Standing preferences

- Match Chapter 1's look and structure exactly; don't redesign.
- Don't edit `style.css` or `script.js` unless Joseph asks, or unless a genuinely
  new component needs it (the `.ch*` block for the index was such a case).
- Simple layman language, sharp and short, but complete and accurate.
- All math in KaTeX (`\( \)` inline, `\[ \]` display), never raw Unicode.
