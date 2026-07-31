/* ============================================================
   MATH BOOK — BACK TO TOP
   A small round button pinned to the bottom-right corner that
   jumps to the very top of the page.

   It joins the sync chip's fixed stack when sync.js has built one,
   so the two can never overlap and the sync popover still opens
   above both; on a page without sync (index.html) it makes its own
   wrapper. Load it LAST, after sync.js.

   It fades in once the page is scrolled past about one screen —
   at the top of the page a "back to top" button has nothing to do.
   ============================================================ */

(function () {
  var SHOW_AFTER = 0.8;            /* screens scrolled before it appears */

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'totop';
  btn.title = 'Back to top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '&#8679;';

  /* the sync chip's stack if it exists (pop, chip, then us — so we
     land in the corner and the popover opens clear above), else ours */
  var host = document.querySelector('.syncwrap');
  if (!host) {
    host = document.createElement('div');
    host.className = 'topwrap';
    document.body.appendChild(host);
  }
  host.appendChild(btn);

  var smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    window.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'auto' });
    /* a hash left in the URL would fight the scroll on the next reload */
    if (location.hash && history.replaceState) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  });

  /* --- show / hide, one repaint per frame --- */
  var queued = false;
  function paint() {
    queued = false;
    btn.classList.toggle('show', window.scrollY > window.innerHeight * SHOW_AFTER);
  }
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(paint);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  paint();
})();
