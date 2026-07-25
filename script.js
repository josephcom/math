/* ============================================================
   MATH BOOK — SHARED INTERACTION SCRIPT
   Behavior:
   - Click a list item  -> its example slides open
   - Click another item -> the open one closes, new one opens
   - Click anywhere else on the page -> the open example closes
   - Clicking inside an open example keeps it open (readable)
   Requires the markup pattern described in STYLE-GUIDE.md.
   ============================================================ */

(function () {
  var openLi = null;

  document.querySelectorAll('.layer ul li').forEach(function (li) {
    li.addEventListener('click', function (e) {
      e.stopPropagation();
      if (e.target.closest('.ex')) return;            // reading an example shouldn't close it
      if (openLi && openLi !== li) openLi.classList.remove('on');
      li.classList.toggle('on');
      openLi = li.classList.contains('on') ? li : null;
    });
  });

  document.addEventListener('click', function () {
    if (openLi) { openLi.classList.remove('on'); openLi = null; }
  });
})();
