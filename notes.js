/* ============================================================
   MATH BOOK — FREE NOTES
   A third sliding box — this one is the reader's own. It hangs off
   every heading (h1, layer title, block heading) and every list item.

   - It slides exactly like the example and proof boxes: one click on the
     item reveals all three, clicking elsewhere closes them. A heading is
     clickable the same way once it holds a note. The pencil is how you
     write: it reveals the note, and drops into edit mode if it is empty
     or already open. While a note is being edited its item stays put.
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
   No dependencies beyond the KaTeX the page already loads.
   ============================================================ */

(function () {
'use strict';

/* -----------------------------------------------------------------
   1. STORAGE
   ----------------------------------------------------------------- */

var PREFIX = 'mathnotes.v1.';
var PAGE = location.pathname.split('/').pop() || 'index.html';
var KEY  = PREFIX + PAGE;
var TOMB = 90 * 24 * 3600 * 1000;          // keep a delete marker this long
var warned = false;
var watchers = [], refreshers = [];

function readKey(k) {
  try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; }
}
function writeKey(k, obj) {
  try { localStorage.setItem(k, JSON.stringify(obj)); return true; }
  catch (e) {
    if (!warned) {
      warned = true;
      alert('This browser refused to save the note (storage blocked or full).\n' +
            'The text stays on screen, but it will be gone when you leave the page.');
    }
    return false;
  }
}

/* A deleted note leaves a tombstone {d:1,u:...} rather than vanishing, so the
   delete travels to the other browsers instead of being undone by them. */
function sweep(db) {
  var now = Date.now();
  Object.keys(db).forEach(function (k) {
    var e = db[k];
    if (!e || (e.d && now - (e.u || 0) > TOMB)) delete db[k];
  });
  return db;
}

/* This page's entries, keyed by anchor id. bookmark.js parks its own
   reserved key ("@bookmark") in here too, so it syncs with the notes. */
var DB = sweep(readKey(KEY));

function persist() { return writeKey(KEY, DB); }
function announce() { watchers.forEach(function (f) { try { f(); } catch (e) {} }); }

function getNote(id) { var e = DB[id]; return e && !e.d ? e.t : ''; }
function setNote(id, txt) { DB[id] = { t: txt, u: Date.now() }; persist(); announce(); }
function delNote(id) { DB[id] = { d: 1, u: Date.now() }; persist(); announce(); }

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
    panel._painted = true;
  }

  /* `filled` = there is something to reveal, so the box rides along with
     its item's .on class. `editing` on the panel keeps an unsaved note
     visible and tells script.js to leave the item alone meanwhile. */
  function mark() {
    var has = !!getNote(id);
    panel.classList.toggle('filled', has);
    btn.classList.toggle('has', has);
    btn.title = has ? 'Your note' : 'Add a note';
    if (kind === 'h') host.classList.toggle('hasnote', has);
  }
  function edit() {
    if (!panel._painted) paint();
    ta.value = getNote(id);
    box.classList.add('editing');
    box.classList.remove('dirty');
    panel.classList.add('editing');
    autosize(ta);
    ta.focus();
  }
  function stopEdit() {
    box.classList.remove('editing', 'dirty');
    panel.classList.remove('editing');
  }

  panel.addEventListener('click', function (e) { e.stopPropagation(); });
  panel.addEventListener('keydown', function (e) { e.stopPropagation(); });

  panel.querySelector('.n-edit').addEventListener('click', edit);

  panel.querySelector('.n-save').addEventListener('click', function () {
    var txt = ta.value.replace(/\s+$/, '');
    if (!txt.trim()) { delNote(id); } else { setNote(id, txt); }
    paint(); mark(); stopEdit();
    if (kind === 'h' && !getNote(id)) hide();
  });

  panel.querySelector('.n-cancel').addEventListener('click', function () {
    stopEdit();
    if (kind === 'h' && !getNote(id)) hide();
  });

  panel.querySelector('.n-del').addEventListener('click', function () {
    if (!confirm('Delete this note?')) return;
    delNote(id); paint(); mark(); stopEdit(); hide();
  });

  ta.addEventListener('input', function () {
    autosize(ta);
    box.classList.toggle('dirty', ta.value !== getNote(id));
  });

  ta.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); panel.querySelector('.n-cancel').click(); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); panel.querySelector('.n-save').click(); }
  });

  /* headings own their open state; items borrow their item's */
  function shown() {
    return kind === 'h' ? panel.classList.contains('open') : host.classList.contains('on');
  }
  function show() {
    if (!panel._painted) paint();
    document.querySelectorAll('.note.open').forEach(function (p) {   // one heading note at a time
      if (p !== panel && !p.classList.contains('editing')) p.classList.remove('open');
    });
    if (kind === 'h') panel.classList.add('open');
    else if (typeof revealItem === 'function') revealItem(host);
    else host.classList.add('on');
    btn.setAttribute('aria-expanded', 'true');
  }
  function hide() {
    if (kind === 'h') panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }

  /* called after a pull brings newer text down from the gist */
  btn._repaint = function () {
    if (box.classList.contains('editing')) { mark(); return; }   // never clobber a live editor
    if (panel._painted) paint();
    mark();
  };

  mark();
  panel._btn = btn;
  btn._panel = panel;
  btn._show = show;
  btn._hide = hide;
  btn._edit = edit;
  btn._shown = shown;
  btn._empty = function () { return !getNote(id); };
  return panel;
}

function attach(host, kind) {
  var id = anchorId(host, kind);
  var had = !!getNote(id);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'notebtn' + (had ? ' has' : '');
  btn.setAttribute('data-nid', id);
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Note');
  btn.title = had ? 'Your note' : 'Add a note';
  btn.innerHTML = '&#9998;';
  btn._host = host;
  btn._kind = kind;
  if (had && kind === 'h') host.classList.add('hasnote');

  /* The pencil reveals the note, and writes in it: empty -> straight into
     edit mode; already revealed -> edit mode; otherwise just show it. */
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    panelFor(btn);
    var wasShown = btn._shown();
    btn._show();
    if (btn._empty() || wasShown) btn._edit();
  });

  /* A heading has no reveal of its own, so clicking it toggles its note —
     the same gesture that opens an item's example. */
  if (kind === 'h') {
    host.addEventListener('click', function (e) {
      if (e.target.closest('.note, .notebtn, .markbtn')) return;
      if (!getNote(id)) return;                       // nothing to reveal yet; use the pencil
      e.stopPropagation();
      panelFor(btn);
      if (btn._shown()) btn._hide(); else btn._show();
    });
  }

  host.appendChild(btn);
}

document.querySelectorAll('header h1, .layer h2.ltitle, .layer h3').forEach(function (el) { attach(el, 'h'); });
document.querySelectorAll('.layer ul > li').forEach(function (el) { attach(el, 'i'); });

/* a click elsewhere closes an open heading note, unless it is being edited
   (script.js applies the same rule to the items) */
document.addEventListener('click', function () {
  document.querySelectorAll('.note.open').forEach(function (p) {
    if (p.classList.contains('editing')) return;
    p.classList.remove('open');
    if (p._btn) p._btn.setAttribute('aria-expanded', 'false');
  });
});

/* don't lose half-typed notes to a stray reload */
window.addEventListener('beforeunload', function (e) {
  if (document.querySelector('.nbox.editing.dirty')) { e.preventDefault(); e.returnValue = ''; }
});

/* -----------------------------------------------------------------
   5. PUBLIC API
   Storage I/O for sync.js (which owns the merge), plus console helpers.
   `all()` / `replaceAll()` speak the whole book: { page: { id: entry } }.
   ----------------------------------------------------------------- */

function pages() {
  var out = [];
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k && k.indexOf(PREFIX) === 0) out.push(k.slice(PREFIX.length));
  }
  if (out.indexOf(PAGE) < 0) out.push(PAGE);
  return out;
}

window.mathNotes = {
  page: PAGE,

  /* The store is shared: notes.js owns the anchor-id entries, bookmark.js
     owns its own reserved key. Both ride the same sync. */
  get: function (id) { return getNote(id); },
  set: function (id, txt) { setNote(id, txt); },
  del: function (id) { delNote(id); },

  all: function () {
    var out = {};
    pages().forEach(function (p) { out[p] = p === PAGE ? DB : sweep(readKey(PREFIX + p)); });
    return out;
  },

  /* Take a snapshot in, then bring this page's boxes up to date.
     Deliberately NOT a replace: an incoming entry never overwrites a newer
     local one, so a note saved while a sync was in flight survives the
     round trip instead of being reverted by the older snapshot. */
  absorb: function (data) {
    Object.keys(data).forEach(function (p) {
      var cur = p === PAGE ? DB : readKey(PREFIX + p);
      var inc = data[p] || {};
      Object.keys(inc).forEach(function (k) {           // same rule as sync.js's merge
        var mine = cur[k], theirs = inc[k];
        if (!mine) { cur[k] = theirs; return; }
        var gap = (theirs.u || 0) - (mine.u || 0);
        if (gap > 0 || (gap === 0 && mine.d && !theirs.d)) cur[k] = theirs;
      });
      if (p === PAGE) persist(); else writeKey(PREFIX + p, cur);
    });
    window.mathNotes.refresh();
  },

  /* re-read every pencil and every built panel from the current DB */
  refresh: function () {
    document.querySelectorAll('.notebtn').forEach(function (btn) {
      if (btn._repaint) { btn._repaint(); return; }
      var has = !!getNote(btn.getAttribute('data-nid'));
      btn.classList.toggle('has', has);
      btn.title = has ? 'Your note' : 'Add a note';
      if (btn._kind === 'h') btn._host.classList.toggle('hasnote', has);
    });
    refreshers.forEach(function (f) { try { f(); } catch (e) {} });
  },

  onChange: function (fn) { watchers.push(fn); },
  /* onChange fires on a local write — sync.js pushes on it. onRefresh fires
     once a pull has landed and the page was repainted from the store. */
  onRefresh: function (fn) { refreshers.push(fn); },
  editing: function () { return !!document.querySelector('.nbox.editing.dirty'); },

  export: function () { return JSON.stringify(window.mathNotes.all(), null, 2); },
  import: function (json) {
    var incoming = typeof json === 'string' ? JSON.parse(json) : json;
    if (incoming[PAGE] || incoming[Object.keys(incoming)[0]] &&
        typeof incoming[Object.keys(incoming)[0]] === 'object' &&
        !('t' in incoming[Object.keys(incoming)[0]]) &&
        !('d' in incoming[Object.keys(incoming)[0]])) {
      window.mathNotes.absorb(incoming);                     // whole-book shape
      return 'Imported ' + Object.keys(incoming).length + ' page(s).';
    }
    Object.keys(incoming).forEach(function (k) { DB[k] = incoming[k]; });
    persist(); announce(); window.mathNotes.refresh();       // single-page shape
    return 'Imported ' + Object.keys(incoming).length + ' note(s).';
  },
  render: render
};

})();
