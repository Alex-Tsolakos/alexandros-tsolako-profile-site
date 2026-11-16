// Extra scripts: touch-friendly Interests animations and lighter hero video loading
(function () {
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- 1. Interests cards: animate on hover (mouse) and on scroll/tap (touch) ----------
  var cards = document.querySelectorAll(".services .service-item");
  var rocket = document.querySelector(".rocket-img");
  if (rocket) { (new Image()).src = rocket.dataset.anim; } // preload the GIF so the swap is instant

  function setActive(card, on) {
    card.classList.toggle("is-active", on);
    var img = card.querySelector(".rocket-img");
    if (img && !reduce) img.src = on ? img.dataset.anim : img.dataset.still;
  }

  // Mouse: same behaviour as before (hover)
  cards.forEach(function (card) {
    card.addEventListener("mouseenter", function () { setActive(card, true); });
    card.addEventListener("mouseleave", function () { setActive(card, false); });
  });

  // Touch screens (no hover): play while the card is on screen, and toggle on tap
  var touch = window.matchMedia && matchMedia("(hover: none)").matches;
  if (touch && !reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { setActive(e.target, e.isIntersecting); });
    }, { threshold: 0.7 });
    cards.forEach(function (card) { io.observe(card); });
    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        setActive(card, !card.classList.contains("is-active"));
      });
    });
  }

  // ---------- 2. Hero video: only load on larger screens with a good connection ----------
  var hero = document.querySelector(".hero-video");
  if (hero) {
    var c = navigator.connection || {};
    var small = window.matchMedia && matchMedia("(max-width: 767px)").matches;
    var slow = c.saveData || /(^|-)2g$|3g/.test(c.effectiveType || "");
    if (!small && !slow && !reduce && hero.dataset.src) {
      hero.src = hero.dataset.src;
      hero.load();
      var p = hero.play(); if (p && p.catch) p.catch(function () {});
      // pause when the hero is scrolled out of view (saves battery and CPU)
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { var q = hero.play(); if (q && q.catch) q.catch(function () {}); }
            else hero.pause();
          });
        }).observe(hero);
      }
    }
    // otherwise the poster image (hero-bg.jpg) stays as the background
  }
})();
