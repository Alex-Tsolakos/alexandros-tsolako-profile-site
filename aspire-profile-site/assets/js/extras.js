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
  function startHero() {
    var c = navigator.connection || {};
    var small = window.matchMedia && matchMedia("(max-width: 767px)").matches;
    var slow = c.saveData || /(^|-)2g$|3g/.test(c.effectiveType || "");
    if (!small && !slow && !reduce && hero.dataset.src && !hero.getAttribute("src")) {
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
  if (hero) {
    // wait for the welcome screen: the video starts only after the visitor presses Enter
    var splashUp = document.getElementById("splash") && !document.documentElement.classList.contains("no-splash");
    if (splashUp) document.addEventListener("splash:leave", startHero, { once: true });
    else startHero();
  }
})();

// ---------- 3. Welcome screen: stays until the visitor presses Enter, then slides up to reveal the profile ----------
(function () {
  var splash = document.getElementById("splash");
  if (!splash) return;
  if (document.documentElement.classList.contains("no-splash")) { splash.remove(); return; }
  var done = false;
  function leave() {
    if (done) return;
    done = true;
    try { sessionStorage.setItem("splashSeen", "1"); } catch (e) {}
    splash.classList.add("leave");
    document.dispatchEvent(new Event("splash:leave"));
    setTimeout(function () { splash.remove(); }, 1100);
  }
  var btn = document.getElementById("splash-enter");
  btn.addEventListener("click", leave);
  document.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === "Escape") leave(); });
})();

// ---------- 4. Rocket scroll progress, floating contact button, copy email, keyboard-friendly menu button ----------
(function () {
  var rp = null, rk = null;
  var fc = document.querySelector(".float-contact"), contact = document.getElementById("contact");
  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    var f = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    if (rk) rk.style.top = f * (rp.clientHeight - 40) + "px";
    if (fc && contact) { var r = contact.getBoundingClientRect(); fc.classList.toggle("hide", r.top < innerHeight && r.bottom > 0); }
  }
  addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); onScroll();
  var b = document.querySelector(".copy-email");
  if (b) b.addEventListener("click", function () {
    var t = b.querySelector("span"), old = t.textContent, mail = b.dataset.email;
    function ok() { t.textContent = b.dataset.copied; setTimeout(function () { t.textContent = old; }, 2000); }
    if (navigator.clipboard) navigator.clipboard.writeText(mail).then(ok, function () { location.href = "mailto:" + mail; });
    else location.href = "mailto:" + mail;
  });
  var tg = document.querySelector(".header-toggle");
  if (tg) {
    tg.setAttribute("role", "button"); tg.setAttribute("tabindex", "0");
    tg.setAttribute("aria-label", document.documentElement.lang === "el" ? "Μενού" : "Menu");
    tg.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tg.click(); } });
  }
})();

// ---------- 5. Rocket scroll bars: Starship flight profile, driven by scroll; draggable ----------
// Scroll UP (launch): engine start, launch, ascent (pitching over), hot staging in the middle. Booster: flip, boostback burn, descent, landing burn, splashdown.
//                     Ship: ascent, engine cutoff, coast (horizontal) at the top.
// Scroll DOWN (return): ship entry (belly flop, plasma), flip maneuver, landing burn. The booster is only shown on the way up.
// The launch tower at the bottom holds the stack at launch, catches the booster with its chopsticks, and catches the ship when it returns.
(function () {
  var FLAME = '<svg viewBox="0 0 14 30" preserveAspectRatio="none" aria-hidden="true"><path d="M7 0C12 7 13 17 7 30 1 17 2 7 7 0z" fill="#ff8a3d"/><path d="M7 0C10 6 10.5 13 7 21 3.5 13 4 6 7 0z" fill="#ffe08a"/></svg>';
  var BOOSTER = '<svg class="rb-bsvg" viewBox="0 0 24 70" aria-hidden="true">' +
    '<path d="M7.2 0H16.8V64H7.2z"/><rect x="3.2" y="2" width="4" height="4.6" rx=".7"/><rect x="16.8" y="2" width="4" height="4.6" rx=".7"/>' +
    '<path d="M7.2 62L5.6 70H18.4L16.8 62z"/>' +
    '<path class="d" d="M7.2 11H16.8M7.2 24H16.8M7.2 38H16.8M7.2 51H16.8" stroke-width=".7" fill="none"/>' +
    '<path class="dd" d="M8.4 70V67.4H10.4V70zM13.6 70V67.4H15.6V70z"/></svg>';
  // Launch tower drawn to height h: truss shaft, lightning mast, crane boom, wide base with pipes, launch mount (like the real Mechazilla)
  function towerSVG(h) {
    var o = '<svg width="40" height="' + h + '" viewBox="-3 0 40 ' + h + '" aria-hidden="true">', y, top = 14, P = 8;
    o += '<rect x="5.6" y="0" width=".8" height="' + (top + 2) + '"/>';                                   // lightning mast
    o += '<rect x="1" y="' + top + '" width="1.2" height="' + (h - top) + '"/><rect x="9.8" y="' + top + '" width="1.2" height="' + (h - top) + '"/>'; // rails
    o += '<path class="x" fill="none" stroke-width=".55" d="';
    for (y = top; y + P <= h - 6; y += P) o += 'M1 ' + y + 'L11 ' + (y + P) + 'M11 ' + y + 'L1 ' + (y + P);   // X bracing
    o += '"/>';
    for (y = top; y <= h - 6; y += P) o += '<rect x="1" y="' + y + '" width="10" height=".7"/>';             // horizontal chords
    o += '<rect x="-1" y="' + (top - 3) + '" width="14" height="3.4" rx=".6"/>';                           // top cap
    o += '<rect x="11" y="' + (top + 1) + '" width="17" height="1.1"/><rect x="11" y="' + (top + 5) + '" width="17" height="1.1"/>' + // crane boom
         '<path class="x" fill="none" stroke-width=".55" d="M11 ' + (top + 6) + 'L15 ' + (top + 1) + 'L19 ' + (top + 6) + 'L23 ' + (top + 1) + 'L27 ' + (top + 6) + '"/>' +
         '<path class="x" fill="none" stroke-width=".7" d="M11 ' + (top + 14) + 'L22 ' + (top + 6) + '"/><rect x="26" y="' + (top + 6) + '" width="1.2" height="5"/>'; // brace + hook
    o += '<path d="M-3 ' + h + 'L-1 ' + (h - 10) + 'H13L15 ' + h + 'z"/>';                                       // wide base
    o += '<rect x="13" y="' + (h - 5) + '" width="8" height="1.8"/><rect x="13" y="' + (h - 2.6) + '" width="8" height="1.4"/>'; // pipes
    o += '<rect x="15" y="' + (h - 30) + '" width="19" height="2.6"/><rect x="16" y="' + (h - 28) + '" width="1.6" height="28"/><rect x="31.4" y="' + (h - 28) + '" width="1.6" height="28"/>'; // launch mount
    return o + '</svg>';
  }
  var ARM = '<svg width="12" height="6" viewBox="0 0 12 6" overflow="visible" aria-hidden="true"><rect x="0" y="0" width="12" height="1"/><rect x="0" y="5" width="12" height="1"/><path class="x" fill="none" stroke-width=".6" d="M0 6L2 0 4 6 6 0 8 6 10 0 12 6"/><rect x="-3.5" y="-1.5" width="4.5" height="9" rx=".8"/><rect x="10.2" y="-2" width="1.8" height="10" rx=".8"/></svg>';
  var RES = 152, STAGE = 0.55, TILT = 18, D = 59, RAD = Math.PI / 180; // RES: room kept at the bottom of the bar; D: ship centre to booster centre
  function clamp(v) { return Math.min(1, Math.max(0, v)); }
  function ramp(f, a, b) { return clamp((f - a) / (b - a)); }
  function build(cls, src, sc) {
    var bar = document.createElement("div");
    bar.className = "rbar " + cls; bar.setAttribute("aria-hidden", "true");
    bar.innerHTML = '<span class="rb-line"></span><div class="rb-tower"></div><span class="rb-ground"></span><span class="rb-smoke"></span><div class="rb-arm">' + ARM + '</div><div class="rb-rocket">' +
      '<div class="rb-boost">' + BOOSTER + '<div class="rb-bflame">' + FLAME + '</div></div>' +
      '<div class="rb-flash"></div>' +
      '<div class="rb-ship"><div class="rb-sflame">' + FLAME + '</div><div class="rb-plasma"></div><img class="rb-img" src="' + src + '" alt=""></div></div>';
    document.body.appendChild(bar);
    var rocket = bar.querySelector(".rb-rocket"), ship = bar.querySelector(".rb-ship"), sflame = bar.querySelector(".rb-sflame"),
        plasma = bar.querySelector(".rb-plasma"), flash = bar.querySelector(".rb-flash"), boost = bar.querySelector(".rb-boost"),
        bflame = bar.querySelector(".rb-bflame"), tower = bar.querySelector(".rb-tower"), smoke = bar.querySelector(".rb-smoke"), th = 0, arm = bar.querySelector(".rb-arm"), page = sc === window, last = null, mode = "down";
    function m() { return page ? { max: document.documentElement.scrollHeight - innerHeight, pos: scrollY } : { max: sc.scrollHeight - sc.clientHeight, pos: sc.scrollTop }; }
    function update() {
      var s = m(), f = s.max > 0 ? clamp(s.pos / s.max) : 0, show = s.max > 4;
      if (last !== null && Math.abs(s.pos - last) > 0.5) mode = s.pos < last ? "up" : "down";
      last = s.pos;
      if (!page) { var r = sc.getBoundingClientRect(); show = show && r.right > 60; bar.style.left = (r.right - 32) + "px"; }
      bar.style.display = show ? "" : "none";
      var H = bar.clientHeight, span = H - RES;
      rocket.style.top = f * span + "px";
      var rot = 0, pl = 0, sOn = 0, bOn = 0, bo = 0, fl = 0, bx = 0, by = 0, br = 0, closed = false;
      if (mode === "up") {
        var pad = 0.35 + 0.65 * ramp(1 - f, 0, 0.05);                     // Super Heavy engine start
        sOn = clamp((0.62 - f) / 0.08) * ramp(f, 0.1, 0.2);               // ship lights at hot staging, engine cutoff near the top
        fl = Math.max(0, 1 - Math.abs(f - STAGE) / 0.035);                // hot staging flash
        bo = 1;
        if (f >= STAGE) {                                                 // launch + ascent: stack pitches over together
          rot = TILT * ramp(1 - f, 0, 1 - STAGE); br = rot;
          bx = -D * Math.sin(rot * RAD); by = D * (Math.cos(rot * RAD) - 1);
          bOn = pad;
          closed = f > 0.975;                                             // the tower holds the stack until it lifts off
        } else {                                                          // booster on its own path
          rot = TILT + (90 - TILT) * ramp(STAGE - f, 0, 0.5);
          var p = ramp(STAGE - f, 0, 0.43), e = p * p, Lb = H - 102, S = STAGE * span + 50;
          var bx0 = -D * Math.sin(TILT * RAD), by0 = D * (Math.cos(TILT * RAD) - 1);
          bx = bx0 * (1 - e) - 5 * Math.sin(Math.PI * p);
          by = by0 * (1 - e) + (STAGE - f) * span + (Lb - S) * e;
          var flip = ramp(p, 0.05, 0.25), back = ramp(p, 0.45, 0.65);
          br = TILT * (1 - ramp(p, 0.3, 0.65)) + 180 * flip * (1 - back);   // flip maneuver, then engines-down again
          var cut = pad * ramp(f, 0.5, STAGE), boostback = ramp(p, 0.22, 0.3) * (1 - ramp(p, 0.38, 0.46)),
              landing = ramp(p, 0.8, 0.86) * (1 - ramp(p, 0.96, 1));
          bOn = Math.max(cut, 0.8 * boostback, landing);
          closed = p > 0.96;                                              // chopsticks close on the booster
        }
      } else {
        rot = 90 * (1 - ramp(f, 0.86, 0.96));                             // coast at the top, belly flop through the atmosphere, flip before landing
        pl = ramp(f, 0.05, 0.3) * (1 - ramp(f, 0.72, 0.88));              // plasma
        sOn = ramp(f, 0.92, 0.97) * (1 - ramp(f, 0.98, 0.995));            // landing burn, engines off once caught
        closed = f > 0.985;                                               // chopsticks close on the ship
      }
      boost.style.opacity = bo;
      boost.style.transform = "translate(" + bx + "px," + by + "px) rotate(" + br + "deg)";
      bflame.style.transform = "scaleY(" + (0.2 + 0.8 * bOn) + ")"; bflame.style.opacity = bOn > 0.02 ? Math.min(1, bOn) : 0;
      sflame.style.transform = "scaleY(" + sOn + ")"; sflame.style.opacity = sOn > 0.02 ? 1 : 0;
      flash.style.opacity = fl;
      ship.style.transform = "translateX(" + (-7 * rot / 90) + "px) rotate(" + rot + "deg)";
      plasma.style.opacity = pl;
      ship.style.filter = pl > 0.03 ? "drop-shadow(0 0 " + (2 + 5 * pl) + "px rgba(255,110,40," + (0.9 * pl) + "))" : "none";
      var h = Math.min(235, H - 6);
      if (h !== th) { th = h; tower.innerHTML = towerSVG(h); }
      smoke.style.opacity = mode === "up" ? 0.85 * ramp(f, 0.72, 0.95) : 0.5 * ramp(f, 0.93, 1); // launch smoke / landing dust
      arm.style.top = (mode === "up" ? H - 98 : H - 118) + "px";         // booster catch height / ship catch height
      arm.classList.toggle("closed", closed);
    }
    function seek(e) {
      var r = bar.getBoundingClientRect(), s = m();
      var f = Math.min(1, Math.max(0, (e.clientY - r.top - 26) / (r.height - RES)));
      if (page) scrollTo({ top: f * s.max, behavior: "instant" }); else sc.scrollTop = f * s.max;
    }
    var drag = false;
    bar.addEventListener("pointerdown", function (e) { drag = true; bar.setPointerCapture(e.pointerId); seek(e); });
    bar.addEventListener("pointermove", function (e) { if (drag) seek(e); });
    bar.addEventListener("pointerup", function () { drag = false; });
    (page ? window : sc).addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update); update();
    return update;
  }
  var ups = [build("page", "assets/img/starship-dark.png", window)];
  var hd = document.getElementById("header");
  if (hd) ups.push(build("side", "assets/img/starship-white.png", hd));
  setInterval(function () { ups.forEach(function (u) { u(); }); }, 600); // keeps the bars right when the menu opens or the page grows
})();
