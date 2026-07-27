/* ============================================================
   MATH BOOK — FREE NOTES
   A third sliding box — this one is the reader's own. It hangs off
   every heading (h1, layer title, block heading) and every list item.

   - Click the small pencil to open the note; click it again to close.
   - Edit mode shows the RAW text; view mode shows it rendered.
   - The raw text may mix Markdown and LaTeX, so a Claude answer can
     be pasted in unchanged. Supported: # headings, **bold**, *italic*,
     `code`, ```fenced blocks```, - and 1. lists (nested), > quotes,
     | pipe tables |, --- rules, [links](url), - [ ] task boxes,
     and math as $...$, $$...$$, \( ... \) or \[ ... \].
   - Notes save to this browser's localStorage, one entry per page:
       mathnotes.v1.<file>  ->  { "<anchor-id>": {t:"raw", u:<ms>} }
     They are NOT in the repo and do not travel between browsers or
     between the local file and the published site. Backup helpers:
       mathNotes.export()      -> JSON string of this page's notes
       mathNotes.import(json)  -> merge that JSON back in
   - Independent of the example/proof boxes: opening a note does not
     open the example, and a click elsewhere on the page will not
     close a note (you'd lose what you were typing).

   No dependencies beyond the KaTeX the page already loads.
   ============================================================ */

(function () {
'use strict';

/* -----------------------------------------------------------------
   1. STORAGE
   ----------------------------------------------------------------- */

var PAGE = location.pathname.split('/').pop() || 'index.html';
var KEY  = 'mathnotes.v1.' + PAGE;
var DB   = {};
var warned = false;

try { DB = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { DB = {}; }

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(DB)); return true; }
  catch (e) {
    if (!warned) {
      warned = true;
      alert('This browser refused to save the note (storage blocked or full).\n' +
            'The text stays on screen, but it will be gone when you leave the page.');
    }
    return false;
  }
}
function getNote(id) { return DB[id] ? DB[id].t : ''; }
function setNote(id, txt) { DB[id] = { t: txt, u: Date.now() }; persist(); }
function delNote(id) { delete DB[id]; persist(); }

/* -----------------------------------------------------------------
   2. MARKDOWN + LATEX  ->  HTML
   Code, then math, then inline code are pulled out into sentinel
   placeholders first, so the Markdown pass can never chew on a
   backslash, an underscore or an asterisk that belongs to TeX.
   ----------------------------------------------------------------- */

var S1 = '\uE000', S2 = '\uE001';   // private-use sentinels, never in real text
var MAXDEPTH = 6;

function esc(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function katexHTML(tex, display) {
  if (typeof katex === 'undefined') return '<code>' + esc(tex) + '</code>';
  try {
    return katex.renderToString(tex, { displayMode: !!display, throwOnError: false });
  } catch (e) {
    return '<code class="nbad">' + esc(tex) + '</code>';
  }
}

function safeURL(u) {
  return /^\s*(https?:|mailto:|#|\/|\.\/|\.\.\/|[\w.\-]+(\/|\?|#|$))/i.test(u) ? u : '#';
}

function render(src) {
  var slots = [];
  function slot(o) { slots.push(o); return S1 + (slots.length - 1) + S2; }

  var s = String(src == null ? '' : src)
            .replace(/\r\n?/g, '\n')
            .replace(/[\uE000\uE001]/g, '');            // never trust these in input

  /* fenced code first — nothing inside it is markup or math */
  s = s.replace(/^[ \t]*```[^\n`]*\n([\s\S]*?)^[ \t]*```[ \t]*$/gm, function (m, body) {
    return slot({ k: 'pre', v: body.replace(/\n$/, '') });
  });
  s = s.replace(/```([^`]*)```/g, function (m, body) {      // unterminated / one-liner
    return slot({ k: 'pre', v: body.replace(/^\n|\n$/g, '') });
  });

  /* an escaped dollar is a literal dollar, not a math delimiter */
  s = s.replace(/\\\$/g, function () { return slot({ k: 'txt', v: '$' }); });

  /* display math */
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, function (m, tex) { return slot({ k: 'tex', v: tex, d: true }); });
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, function (m, tex) { return slot({ k: 'tex', v: tex, d: true }); });

  /* inline math */
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, function (m, tex) { return slot({ k: 'tex', v: tex, d: false }); });
  s = s.replace(/(^|[^\\$])\$([^\n$]+?)\$/g, function (m, pre, tex) {
    if (/^\s|\s$/.test(tex)) return m;                     // "$5 and $10" is money, not math
    return pre + slot({ k: 'tex', v: tex, d: false });
  });

  /* inline code */
  s = s.replace(/``([^`\n]+)``/g, function (m, c) { return slot({ k: 'code', v: c }); });
  s = s.replace(/`([^`\n]+)`/g, function (m, c) { return slot({ k: 'code', v: c }); });

  /* everything left is prose: make it HTML-safe before adding our own tags */
  s = esc(s);

  var html = blocks(s, 0);

  /* put the real content back */
  return html.replace(new RegExp(S1 + '(\\d+)' + S2, 'g'), function (m, n) {
    var o = slots[+n];
    if (!o) return '';
    if (o.k === 'txt')  return esc(o.v);
    if (o.k === 'code') return '<code>' + esc(o.v) + '</code>';
    if (o.k === 'pre')  return '<pre><code>' + esc(o.v) + '</code></pre>';
    return katexHTML(o.v, o.d);
  });
}

/* ---- inline span level ---- */
function inline(t) {
  return t
    /* URL group allows one level of nested parens: .../Set_(mathematics) */
    .replace(/!\[([^\]]*)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, function (m, alt, u) {
      return '<img src="' + safeURL(u) + '" alt="' + alt + '">';
    })
    .replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, function (m, txt, u) {
      return '<a href="' + safeURL(u) + '" target="_blank" rel="noopener">' + txt + '</a>';
    })
    .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '<strong>$2</strong>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>')
    .replace(/(^|[\s(\[])\*(?=\S)([^*\n]*?\S)\*(?=[\s).,;:!?\]]|$)/g, '$1<em>$2</em>')
    .replace(/(^|[\s(\[])_(?=\S)([^_\n]*?\S)_(?=[\s).,;:!?\]]|$)/g, '$1<em>$2</em>');
}

/* ---- helpers for the block scanner ---- */
var RE_H    = /^ {0,3}(#{1,6})[ \t]+(.*)$/;
var RE_HR   = /^ {0,3}(-{3,}|\*{3,}|_{3,})[ \t]*$/;
var RE_Q    = /^ {0,3}&gt;/;
var RE_LI   = /^([ \t]*)([-*+]|\d+[.)])[ \t]+([\s\S]*)$/;
var RE_ONLY = new RegExp('^' + S1 + '(\\d+)' + S2 + '$');

function indentOf(ln) { return /^[ \t]*/.exec(ln)[0].replace(/\t/g, '  ').length; }
function isSep(ln) {
  return !!ln && ln.indexOf('|') > -1 && ln.indexOf('-') > -1 && /^[\s|:\-]+$/.test(ln);
}
function isTableTop(lines, i) {
  return lines[i].indexOf('|') > -1 && isSep(lines[i + 1]);
}
function isBlockStart(lines, i) {
  var ln = lines[i];
  return !ln.trim() || RE_H.test(ln) || RE_HR.test(ln) || RE_Q.test(ln) ||
         RE_LI.test(ln) || isTableTop(lines, i);
}
function cells(ln) {
  return ln.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) { return c.trim(); });
}

/* ---- block level ---- */
function blocks(text, depth) {
  var lines = text.split('\n'), out = [], i = 0;

  while (i < lines.length) {
    var ln = lines[i];

    if (!ln.trim()) { i++; continue; }

    if (RE_HR.test(ln)) { out.push('<hr>'); i++; continue; }

    var h = RE_H.exec(ln);
    if (h) {
      var n = h[1].length;
      out.push('<h' + n + '>' + inline(h[2].trim()) + '</h' + n + '>');
      i++; continue;
    }

    if (isTableTop(lines, i)) { i = table(lines, i, out); continue; }

    if (RE_Q.test(ln) && depth < MAXDEPTH) {
      var q = [];
      while (i < lines.length && lines[i].trim() && RE_Q.test(lines[i])) {
        q.push(lines[i].replace(/^ {0,3}&gt;[ \t]?/, ''));
        i++;
      }
      out.push('<blockquote>' + blocks(q.join('\n'), depth + 1) + '</blockquote>');
      continue;
    }

    if (RE_LI.test(ln) && depth < MAXDEPTH) { i = list(lines, i, out, depth); continue; }

    /* paragraph: run to the next block start, keep single newlines as breaks */
    var p = [];
    while (i < lines.length && !isBlockStart(lines, i)) { p.push(lines[i].trim()); i++; }
    if (p.length === 1) {
      var solo = RE_ONLY.exec(p[0]);                  // a lone code block / display formula
      if (solo) { out.push(p[0]); continue; }
    }
    out.push('<p>' + inline(p.join('\n')).replace(/\n/g, '<br>') + '</p>');
  }
  return out.join('');
}

/* ---- pipe table ---- */
function table(lines, i, out) {
  var head = cells(lines[i]);
  var align = cells(lines[i + 1]).map(function (c) {
    if (/^:-+:$/.test(c)) return ' style="text-align:center"';
    if (/:$/.test(c))     return ' style="text-align:right"';
    return '';
  });
  i += 2;
  var body = [];
  while (i < lines.length && lines[i].trim() && lines[i].indexOf('|') > -1) { body.push(cells(lines[i])); i++; }

  var h = head.map(function (c, k) { return '<th' + (align[k] || '') + '>' + inline(c) + '</th>'; }).join('');
  var b = body.map(function (row) {
    return '<tr>' + head.map(function (_, k) {
      return '<td' + (align[k] || '') + '>' + inline(row[k] == null ? '' : row[k]) + '</td>';
    }).join('') + '</tr>';
  }).join('');

  out.push('<table><thead><tr>' + h + '</tr></thead><tbody>' + b + '</tbody></table>');
  return i;
}

/* ---- list (recursive: each item's raw text goes back through blocks) ---- */
function list(lines, i, out, depth) {
  var first = RE_LI.exec(lines[i]);
  var base = indentOf(lines[i]);
  var ordered = /\d/.test(first[2]);
  var items = [], cur = null;

  while (i < lines.length) {
    var ln = lines[i];

    if (!ln.trim()) {                                  // blank line — does the list go on?
      var j = i;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j >= lines.length) break;
      if (indentOf(lines[j]) > base || (RE_LI.test(lines[j]) && indentOf(lines[j]) >= base)) {
        if (cur) cur.push('');
        i = j; continue;
      }
      break;
    }

    var m = RE_LI.exec(ln), ind = indentOf(ln);

    if (m && ind <= base + 1) { cur = [m[3]]; items.push(cur); i++; continue; }   // next sibling
    if (cur && ind > base)    { cur.push(ln.slice(Math.min(ind, base + 2))); i++; continue; }  // nested / continuation
    if (cur && !m)            { cur.push(ln.trim()); i++; continue; }             // lazy continuation
    break;
  }

  var li = items.map(function (it) {
    var box = '';
    it[0] = it[0].replace(/^\[([ xX])\][ \t]+/, function (m, c) {               // - [ ] task box
      box = '<input type="checkbox" disabled' + (c === ' ' ? '' : ' checked') + '> ';
      return '';
    });
    /* drop the wrapper around the item's own first paragraph, so short
       items sit tight even when a nested list follows */
    var inner = blocks(it.join('\n'), depth + 1).replace(/^<p>([\s\S]*?)<\/p>/, '$1');
    return '<li>' + box + inner + '</li>';
  }).join('');

  out.push(ordered ? '<ol>' + li + '</ol>' : '<ul>' + li + '</ul>');
  return i;
}

/* -----------------------------------------------------------------
   3. ANCHOR IDS
   An id is  kind : section : slug-of-the-term  — stable while the
   wording stays put, which is what a note is pinned to.
   ----------------------------------------------------------------- */

function ownText(el) {
  var s = '';
  for (var n = el.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 3) s += n.nodeValue;
    else if (n.nodeType === 1 && n.tagName !== 'DIV' && n.tagName !== 'BUTTON' &&
             !n.classList.contains('katex')) s += n.textContent;
  }
  return s.replace(/\s+/g, ' ').trim();
}

function slug(t) {
  return t.toLowerCase()
          .replace(/\\[()[\]]/g, ' ')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 48) || 'x';
}

var used = {};
function anchorId(el, kind) {
  var sec = el.closest('section[id]');
  var label;
  if (kind === 'i') {
    var b = el.querySelector(':scope > b');
    label = b ? ownText(b) || b.textContent : ownText(el);
  } else {
    label = ownText(el);
  }
  var id = kind + ':' + (sec ? sec.id : 'top') + ':' + slug(label);
  if (used[id]) { used[id]++; id += '~' + used[id]; } else { used[id] = 1; }
  return id;
}

/* -----------------------------------------------------------------
   4. UI
   ----------------------------------------------------------------- */

function autosize(ta) {
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight + 4, Math.round(window.innerHeight * 0.62)) + 'px';
}

function panelFor(btn) {
  if (btn._panel) return btn._panel;

  var id = btn.getAttribute('data-nid');
  var host = btn._host, kind = btn._kind;

  var panel = document.createElement('div');
  panel.className = 'note';
  panel.innerHTML =
    '<div><div class="nbox">' +
      '<div class="nhead"><span class="nlabel">Note</span><span class="nacts">' +
        '<button type="button" class="nbtn n-edit">Edit</button>' +
        '<button type="button" class="nbtn n-del">Delete</button>' +
        '<button type="button" class="nbtn n-save">Save</button>' +
        '<button type="button" class="nbtn n-cancel">Cancel</button>' +
      '</span></div>' +
      '<div class="nview"></div>' +
      '<textarea class="nedit" spellcheck="true" placeholder="Your notes. Markdown and LaTeX both work — paste a Claude answer straight in."></textarea>' +
    '</div></div>';

  if (kind === 'i') {
    host.appendChild(panel);                                   // after .ex / .proof
  } else {
    var after = host;
    if (host.nextElementSibling && host.nextElementSibling.classList.contains('ldesc')) {
      after = host.nextElementSibling;                          // keep the italic layer line with its title
    }
    after.parentNode.insertBefore(panel, after.nextSibling);
  }

  var box = panel.querySelector('.nbox');
  var view = panel.querySelector('.nview');
  var ta = panel.querySelector('.nedit');

  function paint() {
    view.innerHTML = render(getNote(id));
  }
  function edit() {
    ta.value = getNote(id);
    box.classList.add('editing');
    box.classList.remove('dirty');
    autosize(ta);
    ta.focus();
  }
  function stopEdit() {
    box.classList.remove('editing', 'dirty');
  }
  function mark() {
    if (getNote(id)) btn.classList.add('has'); else btn.classList.remove('has');
  }

  panel.addEventListener('click', function (e) { e.stopPropagation(); });
  panel.addEventListener('keydown', function (e) { e.stopPropagation(); });

  panel.querySelector('.n-edit').addEventListener('click', edit);

  panel.querySelector('.n-save').addEventListener('click', function () {
    var txt = ta.value.replace(/\s+$/, '');
    if (!txt.trim()) { delNote(id); } else { setNote(id, txt); }
    paint(); mark(); stopEdit();
    if (!getNote(id)) close();
  });

  panel.querySelector('.n-cancel').addEventListener('click', function () {
    stopEdit();
    if (!getNote(id)) close();
  });

  panel.querySelector('.n-del').addEventListener('click', function () {
    if (!confirm('Delete this note?')) return;
    delNote(id); paint(); mark(); stopEdit(); close();
  });

  ta.addEventListener('input', function () {
    autosize(ta);
    box.classList.toggle('dirty', ta.value !== getNote(id));
  });

  ta.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); panel.querySelector('.n-cancel').click(); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); panel.querySelector('.n-save').click(); }
  });

  function open() {
    if (!panel._painted) { paint(); panel._painted = true; }
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    if (!getNote(id)) edit();
  }
  function close() {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }

  btn._panel = panel;
  btn._open = open;
  btn._close = close;
  btn._isOpen = function () { return panel.classList.contains('open'); };
  return panel;
}

function attach(host, kind) {
  var id = anchorId(host, kind);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'notebtn' + (getNote(id) ? ' has' : '');
  btn.setAttribute('data-nid', id);
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Note');
  btn.title = getNote(id) ? 'Your note' : 'Add a note';
  btn.innerHTML = '&#9998;';
  btn._host = host;
  btn._kind = kind;

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    panelFor(btn);
    if (btn._isOpen()) btn._close(); else btn._open();
  });

  host.appendChild(btn);
}

document.querySelectorAll('header h1, .layer h2.ltitle, .layer h3').forEach(function (el) { attach(el, 'h'); });
document.querySelectorAll('.layer ul > li').forEach(function (el) { attach(el, 'i'); });

/* don't lose half-typed notes to a stray reload */
window.addEventListener('beforeunload', function (e) {
  if (document.querySelector('.nbox.editing.dirty')) { e.preventDefault(); e.returnValue = ''; }
});

/* -----------------------------------------------------------------
   5. BACKUP HELPERS (console)
   ----------------------------------------------------------------- */

window.mathNotes = {
  page: PAGE,
  export: function () { return JSON.stringify(DB, null, 2); },
  import: function (json) {
    var incoming = typeof json === 'string' ? JSON.parse(json) : json;
    Object.keys(incoming).forEach(function (k) { DB[k] = incoming[k]; });
    persist();
    return 'Imported ' + Object.keys(incoming).length + ' note(s). Reload to see them.';
  },
  render: render
};

})();
