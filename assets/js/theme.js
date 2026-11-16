// Dark/light theme and Calm mode (reduced motion) toggles. Loaded on every page; the saved choice is applied early by a tiny script in <head>.
(function () {
  var root = document.documentElement, gr = (root.lang || "en").indexOf("el") === 0;
  var T = gr ? { theme: "Σκούρο θέμα", calm: "Ήρεμη λειτουργία (λιγότερη κίνηση)", group: "Ρυθμίσεις εμφάνισης" }
             : { theme: "Dark theme", calm: "Calm mode (less motion)", group: "Display settings" };
  var ICON = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    calm: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7"/>'
  };
  function svg(p) { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>"; }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function mk(label) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "rb-tool"; b.title = label; b.setAttribute("aria-label", label);
    return b;
  }
  var box = document.createElement("div");
  box.className = "rb-tools" + (document.getElementById("header") ? " with-side" : "");
  box.setAttribute("role", "group"); box.setAttribute("aria-label", T.group);
  var bt = mk(T.theme), bc = mk(T.calm);
  box.appendChild(bt); box.appendChild(bc); document.body.appendChild(box);
  var meta = document.querySelector('meta[name="theme-color"]'), metaLight = meta && meta.content;
  function apply() {
    var dark = root.classList.contains("dark"), calm = root.classList.contains("calm");
    bt.innerHTML = svg(dark ? ICON.sun : ICON.moon); bt.setAttribute("aria-pressed", dark);
    bc.innerHTML = svg(ICON.calm); bc.setAttribute("aria-pressed", calm);
    if (meta) meta.content = dark ? "#0b1220" : metaLight;
    // the page rocket bar needs a light ship on a dark page
    var img = document.querySelector(".rbar.page .rb-img");
    if (img) img.src = dark ? "assets/img/starship-white.png" : "assets/img/starship-dark.png";
  }
  bt.addEventListener("click", function () { root.classList.toggle("dark"); save("theme", root.classList.contains("dark") ? "dark" : "light"); apply(); });
  bc.addEventListener("click", function () { root.classList.toggle("calm"); save("calm", root.classList.contains("calm") ? "1" : "0"); apply(); document.dispatchEvent(new Event("calm:change")); });
  apply();
})();
