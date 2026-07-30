/* ============================================================
   MATH BOOK — BOOKMARK
   One flag per page: "this is where I left off."

   - A ⚑ button sits beside the ✎ pencil on every heading and every
     list item. Click it and that spot is marked. Click the marked one
     again and the page has no bookmark.
   - There is only ever ONE mark per page, by construction: the store
     holds a single key, so marking a new spot is what un-marks the old
     one — nothing has to be hunted down and cleared.
   - The mark itself is a red ribbon down the left edge of the item, and
     the flag goes solid. Red is used for nothing else in the book.
   - A red "⚑ Resume" pill joins the layer chips whenever a mark exists;
     it scrolls to the spot and flashes it.
   - It is saved exactly like a note — same per-page store, same anchor
     ids — so it rides the gist sync to the other browsers for free:
       mathnotes.v1.<file>  ->  { "@bookmark": {t:"<anchor-id>", u:<ms>} }
     Console helpers: mathBookmark.at() / .go() / .clear()

   Requires notes.js (the store, and the anchor ids), loaded before it.
   ============================================================ */

(function () {
'use strict';

var notes = window.mathNotes;
if (!notes) return;                  // notes.js didn't load; there is nowhere to save

var KEY = '@bookmark';               // reserved — real anchor ids are "h:…" / "i:…"

function at() { return notes.get(KEY) || ''; }

/* -----------------------------------------------------------------
   1. THE FLAGS
   Every pencil already carries its host's anchor id, so the flags ride
   along with them rather than deriving a second set of ids that could
   drift out of step.
   ----------------------------------------------------------------- */

var spots = [];

function build(host, id) {
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'markbtn';
  btn.innerHTML = '&#9873;';
  btn.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-label', 'Bookmark');

  btn.addEventListener('click', function (e) {
    e.stopPropagation();             // marking a spot must not open or close it
    e.preventDefault();
    if (at() === id) notes.del(KEY); else notes.set(KEY, id);
    paint();
  });

  host.appendChild(btn);
  return { host: host, id: id, btn: btn };
}

document.querySelectorAll('.notebtn').forEach(function (pencil) {
  var host = pencil.parentElement;
  var id = pencil.getAttribute('data-nid');
  if (host && id) spots.push(build(host, id));
});

/* -----------------------------------------------------------------
   2. PAINT
   ----------------------------------------------------------------- */

function found() {
  var id = at(), hit = null;
  spots.forEach(function (s) { if (s.id === id) hit = s; });
  return hit;                        // null if the wording moved and orphaned it
}

function paint() {
  var id = at();
  spots.forEach(function (s) {
    var on = s.id === id;
    s.btn.classList.toggle('on', on);
    s.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    s.btn.title = on ? 'Where you left off — click to clear' : 'Mark where you left off';
    s.host.classList.toggle('marked', on);
  });
  pill(found());
}

/* -----------------------------------------------------------------
   3. THE RESUME PILL — first chip in the layer nav, only when marked
   ----------------------------------------------------------------- */

var chips = document.querySelector('.chips');
var resume = null;

/* the item's own words, minus the boxes, the buttons and the rendered
   math (whose textContent doubles every symbol) */
function label(host) {
  var c = host.cloneNode(true);
  c.querySelectorAll('.katex, button, div').forEach(function (n) { n.remove(); });
  var t = (c.textContent || '').replace(/\s+/g, ' ').trim();
  return t.length > 64 ? t.slice(0, 62) + '…' : t;
}

function pill(spot) {
  if (!chips) return;
  if (!spot) {
    if (resume) { resume.remove(); resume = null; }
    return;
  }
  if (!resume) {
    resume = document.createElement('button');
    resume.type = 'button';
    resume.className = 'resume';
    resume.innerHTML = '&#9873; Resume';
    resume.addEventListener('click', go);
    chips.insertBefore(resume, chips.firstChild);
  }
  resume.title = 'Where you left off: ' + label(spot.host);
}

function go() {
  var spot = found();
  if (!spot) return;
  var el = spot.host;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  el.classList.remove('markflash');
  void el.offsetWidth;               // restart the flash on a second click
  el.classList.add('markflash');
  setTimeout(function () { el.classList.remove('markflash'); }, 1400);
}

/* -----------------------------------------------------------------
   4. GO
   ----------------------------------------------------------------- */

paint();
notes.onRefresh(paint);              // a pull can move the mark from another browser

window.mathBookmark = {
  at: at,
  go: go,
  clear: function () { notes.del(KEY); paint(); }
};

})();
