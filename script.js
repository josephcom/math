/* ============================================================
   MATH BOOK — SHARED INTERACTION SCRIPT
   Behavior:
   - Click a list item  -> its example, proof and note slide open
   - Click another item -> the open one closes, new one opens
   - Click anywhere else on the page -> the open item closes
   - Clicking inside an open box keeps it open (readable)
   The one exception: an item whose note is being edited stays put,
   so a stray click can't yank the editor away mid-sentence.
   Requires the markup pattern described in STYLE-GUIDE.md.
   Note boxes are built by notes.js, but revealed by this file.
   ============================================================ */

(function () {
  var openLi = null;

  function editing(li) { return !!li && !!li.querySelector('.note.editing'); }

  function close(li) {
    if (!li || editing(li)) return false;
    li.classList.remove('on');
    return true;
  }

  document.querySelectorAll('.layer ul li').forEach(function (li) {
    li.addEventListener('click', function (e) {
      e.stopPropagation();
      if (e.target.closest('.ex, .proof, .note, .notebtn')) return;   // reading a box shouldn't toggle the item
      if (editing(li)) return;
      if (openLi && openLi !== li) close(openLi);
      li.classList.toggle('on');
      openLi = li.classList.contains('on') ? li : openLi === li ? null : openLi;
    });
  });

  document.addEventListener('click', function () {
    if (openLi && close(openLi)) openLi = null;
  });

  /* notes.js calls this when the pencil is used, so the item it opens
     obeys the same one-at-a-time rule as a normal click. */
  window.revealItem = function (li) {
    if (openLi && openLi !== li) close(openLi);
    li.classList.add('on');
    openLi = li;
  };
})();
