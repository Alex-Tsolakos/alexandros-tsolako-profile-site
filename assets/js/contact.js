// Έλεγχος της φόρμας επικοινωνίας (Form validation) – τρέχει πριν από την αποστολή
(function () {
  var form = document.getElementById("contact-form");
  if (!form) return;
  var el = document.documentElement.lang === "el";
  var msg = el ? {
    name: "Γράψε το ονοματεπώνυμό σου (τουλάχιστον 3 χαρακτήρες).",
    email: "Γράψε ένα έγκυρο email, π.χ. onoma@example.com.",
    subject: "Γράψε ένα θέμα (τουλάχιστον 3 χαρακτήρες).",
    message: "Το μήνυμα πρέπει να έχει τουλάχιστον 10 χαρακτήρες.",
    ok: "Το μήνυμά σου στάλθηκε. Θα απαντήσω σύντομα.",
    fail: "Η αποστολή απέτυχε. Στείλε μου email στο alexandrost2004@gmail.com.",
    local: "Η φόρμα στέλνει μηνύματα μόνο όταν η σελίδα είναι ανεβασμένη στο Netlify. Τοπικά, στον υπολογιστή, δεν μπορεί να σταλεί."
  } : {
    name: "Enter your full name (at least 3 characters).",
    email: "Enter a valid email, e.g. name@example.com.",
    subject: "Enter a subject (at least 3 characters).",
    message: "The message must be at least 10 characters long.",
    ok: "Your message was sent. I will reply soon.",
    fail: "Sending failed. Please email me at alexandrost2004@gmail.com.",
    local: "The form only sends messages when the page is hosted on Netlify. It cannot send from your own computer."
  };
  // Κάθε κανόνας επιστρέφει true όταν η τιμή είναι σωστή
  var rules = {
    name: function (v) { return v.trim().length >= 3; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
    subject: function (v) { return v.trim().length >= 3; },
    message: function (v) { return v.trim().length >= 10; }
  };
  function check(field) {
    var ok = rules[field.name](field.value);
    document.getElementById(field.name + "-error").textContent = ok ? "" : msg[field.name];
    field.classList.toggle("is-invalid", !ok);
    field.setAttribute("aria-invalid", String(!ok));
    return ok;
  }
  var fields = Object.keys(rules).map(function (n) { return form.elements[n]; });
  var status = document.getElementById("form-status");
  function show(text, ok) {
    status.textContent = text;
    status.className = "form-status " + (ok ? "ok" : "err");
  }
  form.addEventListener("submit", function (e) {
    var results = fields.map(check);              // ελέγχει όλα τα πεδία
    e.preventDefault();                           // η αποστολή γίνεται παρακάτω με fetch
    if (results.indexOf(false) !== -1) {          // αν κάτι λείπει, σταματά η αποστολή
      fields[results.indexOf(false)].focus();
      return;
    }
    if (location.protocol === "file:") { show(msg.local, false); return; }
    var button = form.querySelector("button");
    button.disabled = true;
    // Το Netlify Forms δέχεται την αποστολή ως POST προς την ίδια σελίδα
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      show(msg.ok, true);
      form.reset();
    }).catch(function () {
      show(msg.fail, false);
    }).then(function () { button.disabled = false; });
  });
  fields.forEach(function (f) { f.addEventListener("blur", function () { check(f); }); });
})();
