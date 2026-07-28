/* ============================================================
   MATH BOOK — NOTE SYNC VIA A SECRET GIST
   Carries the notes written by notes.js between browsers and machines,
   using one secret GitHub gist as the store. No server of our own.

   How it works
   - One file, `math-notes.json`, holding the whole book:
       { "<page.html>": { "<anchor-id>": {t,u} | {d:1,u} } }
   - First connect: the page looks through your gists for that filename
     and adopts it; if there isn't one, it creates a secret gist. So a
     new browser needs the token and nothing else.
   - Merge is PER NOTE, newest `u` wins — two browsers can't clobber each
     other, and a delete travels as a tombstone instead of being undone.
   - Pull on load and on window focus (throttled), push ~1.2s after a save.
   - localStorage stays the source of truth for reading; the gist is the
     courier. If GitHub is unreachable, notes keep working offline.

   The token
   - A classic token with ONLY the `gist` scope. Never a `repo` token —
     this book's repo is public and a token can write to it.
   - It is typed into the chip at the bottom right, kept in this browser's
     localStorage, and never committed. It is not in this file, and it
     must never be put in one.

   Needs http(s): opened straight off the disk (`file://`) the browser
   sends no usable origin and GitHub refuses the request. Use the live
   site, or a localhost server.
   ============================================================ */

(function () {
'use strict';

var notes = window.mathNotes;
if (!notes) return;                       // notes.js didn't load; nothing to sync

var CFG   = 'mathnotes.gist';             // { token, id, last }
var FILE  = 'math-notes.json';
var API   = 'https://api.github.com';
var FOCUS_THROTTLE = 60 * 1000;
var PUSH_DELAY     = 1200;

var cfg = read();
var state = 'off', detail = '';
var queue = Promise.resolve(), waiting = 0, timer = null;
var offline = location.protocol === 'file:';

function read() {
  try { return JSON.parse(localStorage.getItem(CFG) || '{}') || {}; } catch (e) { return {}; }
}
function write() {
  try { localStorage.setItem(CFG, JSON.stringify(cfg)); } catch (e) {}
}

/* -----------------------------------------------------------------
   1. GITHUB
   ----------------------------------------------------------------- */

function gh(path, opts) {
  opts = opts || {};
  opts.headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': 'Bearer ' + cfg.token,
    'X-GitHub-Api-Version': '2022-11-28'
  };
  return fetch(API + path, opts).then(function (r) {
    if (r.status === 401) throw new Error('token rejected (401) — is it still valid?');
    if (r.status === 403) throw new Error('forbidden (403) — the token needs the "gist" scope');
    if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
    return r.json();
  });
}

function fileBody(data) {
  var f = {};
  f[FILE] = { content: stable(data) };
  return JSON.stringify({ files: f });
}

/* adopt the gist that already holds our file, or make one */
function findGist() {
  if (cfg.id) return Promise.resolve(cfg.id);
  return gh('/gists?per_page=100').then(function (list) {
    var hit = (list || []).filter(function (g) { return g.files && g.files[FILE]; })[0];
    if (hit) { cfg.id = hit.id; write(); return hit.id; }
    return fetch(API + '/gists', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + cfg.token,
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        description: 'The Dependency Tower — my notes (created by the book, do not delete)',
        public: false,
        files: JSON.parse(fileBody(notes.all())).files
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('could not create the gist (' + r.status + ')');
      return r.json();
    }).then(function (g) { cfg.id = g.id; write(); return g.id; });
  });
}

function pull(id) {
  return gh('/gists/' + id).then(function (g) {
    var f = g.files && g.files[FILE];
    if (!f) return {};
    if (f.truncated && f.raw_url) return fetch(f.raw_url).then(function (r) { return r.json(); });
    try { return JSON.parse(f.content || '{}'); } catch (e) { throw new Error('the gist file is not valid JSON'); }
  });
}

function push(id, data) {
  return gh('/gists/' + id, { method: 'PATCH', body: fileBody(data) });
}

/* -----------------------------------------------------------------
   2. MERGE  —  per note, newest wins
   ----------------------------------------------------------------- */

function merge(a, b) {
  var out = {}, seen = {};
  [a, b].forEach(function (src) { Object.keys(src || {}).forEach(function (p) { seen[p] = 1; }); });
  Object.keys(seen).forEach(function (p) {
    var l = (a && a[p]) || {}, r = (b && b[p]) || {}, m = {};
    Object.keys(l).forEach(function (k) { m[k] = l[k]; });
    Object.keys(r).forEach(function (k) {
      var mine = m[k], theirs = r[k];
      if (!mine) { m[k] = theirs; return; }
      var gap = (theirs.u || 0) - (mine.u || 0);
      if (gap > 0) m[k] = theirs;
      else if (gap === 0 && mine.d && !theirs.d) m[k] = theirs;   // a tie must never destroy text
    });
    out[p] = m;
  });
  return out;
}

/* key-sorted JSON, so "did anything change?" is a string compare and the
   gist's own diffs stay readable */
function stable(data) {
  var pages = Object.keys(data || {}).sort(), lines = [];
  pages.forEach(function (p) {
    var ids = Object.keys(data[p] || {}).sort(), inner = [];
    ids.forEach(function (id) {
      var e = data[p][id] || {};
      var o = e.d ? { d: 1, u: e.u || 0 } : { t: e.t == null ? '' : e.t, u: e.u || 0 };
      inner.push('    ' + JSON.stringify(id) + ': ' + JSON.stringify(o));
    });
    lines.push('  ' + JSON.stringify(p) + ': {\n' + inner.join(',\n') + '\n  }');
  });
  return '{\n' + lines.join(',\n') + '\n}\n';
}

/* -----------------------------------------------------------------
   3. THE SYNC ITSELF
   ----------------------------------------------------------------- */

/* Runs are serialized on one promise chain, so overlapping calls queue
   instead of returning early — `await sync()` really means "settled". */
function runOnce() {
  if (!cfg.token || offline) { paint(); return Promise.resolve(); }
  setState('busy');
  return findGist().then(function (id) {
    return pull(id).then(function (remote) {
      var local = notes.all();               // read AFTER the pull: the note being
      var merged = merge(local, remote);     // typed during it must not be lost
      var ms = stable(merged);
      if (ms !== stable(local)) notes.absorb(merged);
      if (ms !== stable(remote)) return push(id, merged);
    }).then(function () {
      cfg.last = Date.now(); write(); setState('ok');
    });
  }).catch(function (e) {
    setState('err', e.message || String(e));
  });
}

function sync() {
  waiting++;
  queue = queue.catch(function () {}).then(function () {
    waiting--;
    return runOnce();
  });
  return queue;
}

function later() {
  if (!cfg.token || offline) return;
  setState('busy');
  clearTimeout(timer);
  timer = setTimeout(sync, PUSH_DELAY);
}

notes.onChange(later);

window.addEventListener('focus', function () {
  if (!cfg.token || offline || waiting) return;
  if (Date.now() - (cfg.last || 0) > FOCUS_THROTTLE) sync();
});

window.addEventListener('beforeunload', function (e) {
  if (cfg.token && (timer || waiting)) { e.preventDefault(); e.returnValue = ''; }   // a push hasn't gone out yet
});

/* -----------------------------------------------------------------
   4. THE CHIP
   ----------------------------------------------------------------- */

var chip = document.createElement('button');
chip.type = 'button';
chip.className = 'syncchip';
chip.setAttribute('aria-expanded', 'false');

var pop = document.createElement('div');
pop.className = 'syncpop';

var wrap = document.createElement('div');
wrap.className = 'syncwrap';
wrap.appendChild(pop);
wrap.appendChild(chip);
document.body.appendChild(wrap);

wrap.addEventListener('click', function (e) { e.stopPropagation(); });
document.addEventListener('click', function () { wrap.classList.remove('open'); chip.setAttribute('aria-expanded', 'false'); });
chip.addEventListener('click', function () {
  var open = !wrap.classList.contains('open');
  wrap.classList.toggle('open', open);
  chip.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) paintPop();
});

var LABEL = {
  off:   '&#9679; Notes local only',
  busy:  '&#8635; Syncing notes…',
  ok:    '&#10003; Notes synced',
  err:   '&#9888; Notes sync failed'
};

function setState(s, d) { state = s; detail = d || ''; paint(); if (wrap.classList.contains('open')) paintPop(); }

function paint() {
  var s = cfg.token ? state : 'off';
  chip.className = 'syncchip s-' + s;
  chip.innerHTML = LABEL[s];
  chip.title = detail || (s === 'ok' && cfg.last ? 'Last synced ' + ago(cfg.last) : '');
}

function ago(t) {
  var s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' h ago';
  return Math.round(s / 86400) + ' days ago';
}

function esc(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function paintPop() {
  if (offline) {
    pop.innerHTML =
      '<p class="synctitle">Sync needs a web address</p>' +
      '<p class="syncnote">This page was opened straight from the disk, so GitHub will refuse the ' +
      'request. Open the live site (or a localhost server) and connect there. ' +
      'Notes you write here still save in this browser.</p>';
    return;
  }
  if (!cfg.token) {
    pop.innerHTML =
      '<p class="synctitle">Sync your notes</p>' +
      '<p class="syncnote">Paste a GitHub token with the <b>gist</b> scope and nothing else. ' +
      'It stays in this browser, and your notes go to a <b>secret</b> gist — not into this repo.</p>' +
      '<p class="syncnote"><a href="https://github.com/settings/tokens/new?scopes=gist&description=Math%20book%20notes" ' +
      'target="_blank" rel="noopener">Make one on GitHub &#10132;</a></p>' +
      '<div class="syncrow">' +
        '<input class="synctoken" type="password" autocomplete="off" spellcheck="false" placeholder="paste token">' +
        '<button type="button" class="nbtn s-connect">Connect</button>' +
      '</div>';
    var input = pop.querySelector('.synctoken');
    var go = function () {
      var v = input.value.trim();
      if (!v) return;
      cfg.token = v; write();
      input.value = '';
      sync().then(paintPop);
    };
    pop.querySelector('.s-connect').addEventListener('click', go);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    input.focus();
    return;
  }

  pop.innerHTML =
    '<p class="synctitle">Notes sync</p>' +
    '<p class="syncnote">' +
      (state === 'err' ? '<b>Failed:</b> ' + esc(detail)
       : state === 'busy' ? 'Talking to GitHub…'
       : 'Up to date' + (cfg.last ? ', last synced ' + ago(cfg.last) : '')) +
    '</p>' +
    (cfg.id ? '<p class="syncnote"><a href="https://gist.github.com/' + esc(cfg.id) +
              '" target="_blank" rel="noopener">Open the gist &#10132;</a></p>' : '') +
    '<div class="syncrow">' +
      '<button type="button" class="nbtn s-now">Sync now</button>' +
      '<button type="button" class="nbtn s-off">Disconnect</button>' +
    '</div>';
  pop.querySelector('.s-now').addEventListener('click', function () { sync().then(paintPop); });
  pop.querySelector('.s-off').addEventListener('click', function () {
    if (!confirm('Forget the token in this browser?\nYour notes stay here, and stay in the gist.')) return;
    delete cfg.token; write(); setState('off'); paintPop();
  });
}

paint();
if (cfg.token && !offline) setTimeout(sync, 600);

window.mathNotesSync = { now: sync, state: function () { return { state: state, detail: detail, gist: cfg.id, last: cfg.last }; } };

})();
