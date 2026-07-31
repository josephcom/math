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

   The tower runs Logic -> Set Theory -> the real line -> R^n ->
   distance -> topology -> calculus -> measure -> volume & surface
   in any number of dimensions.
   ============================================================ */

var CHAPTERS = [
  {
    n: 1,
    file: 'chapter-01-logic.html',
    title: 'Logic',
    blurb: 'The ground floor — propositions, connectives, quantifiers, the rules of inference, and every standard method of proof.',
    note: '7 layers'
  },
  {
    n: 2,
    file: 'chapter-02-set-theory.html',
    title: 'Set Theory',
    blurb: 'The ZFC axioms, set operations, relations, functions, cardinality, ordinals and the Axiom of Choice.',
    note: '9 layers'
  },
  {
    n: 3,
    file: 'chapter-03-the-real-line.html',
    title: 'The Real Line',
    blurb: 'Order, completeness, sequences, series, continuity, derivatives and the integral — the one-dimensional space every later space is copied from.',
    note: '7 layers'
  },
  {
    n: 4,
    file: 'chapter-04-vector-spaces.html',
    title: 'Vector Spaces',
    blurb: '\\(\\mathbb{R}^n\\) itself: span, independence, basis, dimension, linear maps, matrices and duality.',
    note: '6 layers'
  },
  {
    n: 5,
    file: 'chapter-05-determinants.html',
    title: 'Determinants',
    blurb: 'The alternating multilinear form that measures signed volume — and everything it decides.',
    note: '5 layers'
  },
  {
    n: 6,
    file: 'chapter-06-inner-products-and-norms.html',
    title: 'Inner Products &amp; Norms',
    blurb: 'Length, angle and orthogonality: the dot product, Cauchy&ndash;Schwarz, Gram&ndash;Schmidt, the spectral theorem and the \\(p\\)-norms.',
    note: '4 layers'
  },
  {
    n: 7,
    file: 'chapter-07-metric-spaces.html',
    title: 'Metric Spaces',
    blurb: 'Distance as an axiom: balls, convergence, completeness, Baire, and the fixed-point theorem.',
    note: '4 layers'
  },
  {
    n: 8,
    file: 'chapter-08-topology-of-rn.html',
    title: 'Topology of \\(\\mathbb{R}^n\\)',
    blurb: 'Open, closed, compact, connected — the facts about shape that survive without distance.',
    note: '4 layers'
  },
  {
    n: 9,
    file: 'chapter-09-continuity-in-rn.html',
    title: 'Continuity in \\(\\mathbb{R}^n\\)',
    blurb: 'Limits in many variables, uniform continuity, the great value theorems, and sequences of functions.',
    note: '4 layers'
  },
  {
    n: 10,
    file: 'chapter-10-differentiation-in-rn.html',
    title: 'Differentiation in \\(\\mathbb{R}^n\\)',
    blurb: 'The derivative as a linear map: partials, gradient, Jacobian, Taylor, Lagrange multipliers, inverse and implicit functions.',
    note: '4 layers'
  },
  {
    n: 11,
    file: 'chapter-11-measure.html',
    title: 'Measure',
    blurb: '\\(\\sigma\\)-algebras, outer measure and Lebesgue measure: what <b>volume</b> actually means in \\(n\\) dimensions.',
    note: '5 layers'
  },
  {
    n: 12,
    file: 'chapter-12-integration.html',
    title: 'Integration',
    blurb: 'The Lebesgue integral, the convergence theorems, Fubini, change of variables by \\(|\\det J|\\), and the \\(L^{p}\\) spaces.',
    note: '5 layers'
  },
  {
    n: 13,
    file: 'chapter-13-balls-and-spheres.html',
    title: 'Balls &amp; Spheres',
    blurb: 'The volume of the \\(n\\)-ball, the surface of the \\(n\\)-sphere, and how strange high dimensions get.',
    note: '4 layers'
  },
  {
    n: 14,
    file: 'chapter-14-curves-and-surfaces.html',
    title: 'Curves &amp; Surfaces',
    blurb: 'Arc length, curvature, the fundamental forms, Gauss&rsquo;s Theorema Egregium, and \\(k\\)-dimensional area inside a bigger space.',
    note: '4 layers'
  },
  {
    n: 15,
    file: 'chapter-15-manifolds.html',
    title: 'Manifolds',
    blurb: 'Charts, atlases, tangent spaces, vector fields and orientation: curved \\(k\\)-dimensional spaces in their own right.',
    note: '4 layers'
  },
  {
    n: 16,
    file: 'chapter-16-differential-forms-and-stokes.html',
    title: 'Differential Forms &amp; Stokes',
    blurb: 'Wedge products, the exterior derivative, the volume form — and the one theorem that contains them all.',
    note: '4 layers'
  },
  {
    n: 17,
    file: 'chapter-17-riemannian-geometry.html',
    title: 'Riemannian Geometry',
    blurb: 'The metric tensor, geodesics, curvature, and the volume of a space measured from inside it.',
    note: '4 layers'
  },
  {
    n: 18,
    file: 'chapter-18-hausdorff-measure-and-dimension.html',
    title: 'Hausdorff Measure &amp; Dimension',
    blurb: '\\(k\\)-dimensional measure in \\(n\\)-dimensional space — and dimension that is not a whole number.',
    note: '4 layers'
  },
  {
    n: 19,
    file: 'chapter-19-convex-bodies.html',
    title: 'Convex Bodies',
    blurb: 'Support functions, Brunn&ndash;Minkowski, the isoperimetric inequality and mixed volumes.',
    note: '4 layers'
  }
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

  /* The cards are injected after parsing, so KaTeX's page-wide pass may
     already have run. If it has, render the cards now; if it hasn't yet,
     it will pick them up on its own. */
  if (window.renderMathInElement) {
    renderMathInElement(host, {
      delimiters: [
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ]
    });
  }
})();
