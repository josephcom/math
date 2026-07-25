/* ============================================================
   MATH BOOK — CHAPTER INDEX (data + renderer for index.html)

   >>> TO ADD A LESSON: add ONE object to the CHAPTERS array below.
       index.html builds its table of contents from this list, so
       nothing else needs editing.

   Fields:
     n      – chapter number (shown on the mint chip)
     file   – the html file, or null if not written yet
     title  – chapter title
     blurb  – one line: what the chapter covers
     note   – small right-hand note (e.g. "11 layers"); optional
   ============================================================ */

var CHAPTERS = [
  {
    n: 1,
    file: 'chapter-01-set-theory-and-logic.html',
    title: 'Set Theory & Logic',
    blurb: 'The ground floor — propositions, quantifiers, the ZFC axioms, relations, functions, the number systems, infinity and choice.',
    note: '11 layers'
  }
  // { n: 2, file: null, title: 'Next Chapter', blurb: 'Coming soon.' }
];

/* ---------- renderer (no need to touch this) ---------- */
(function () {
  var host = document.getElementById('chlist');
  if (!host) return;

  host.innerHTML = CHAPTERS.map(function (c) {
    var soon = !c.file;
    var tag = soon ? 'div' : 'a';
    var href = soon ? '' : ' href="' + c.file + '"';
    var note = c.note ? '<span class="chnote">' + c.note + '</span>' : '';
    return '<' + tag + ' class="ch' + (soon ? ' soon' : '') + '"' + href + '>' +
             '<span class="chapter">Chapter ' + c.n + '</span>' + note +
             '<h2>' + c.title + '</h2>' +
             '<p>' + c.blurb + '</p>' +
             '<span class="go">' + (soon ? 'Coming soon' : 'Read chapter &#10095;') + '</span>' +
           '</' + tag + '>';
  }).join('');
})();
