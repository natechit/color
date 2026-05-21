// ---------------------------------------------------------------
// Χρωμοεπιλογή — small, dependency-free progressive enhancement.
// ---------------------------------------------------------------

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------------------------------------------------------------
// Contact form
//
// If `window.CONTACT_ENDPOINT` is set (see config block below or
// inject at deploy time), the form POSTs JSON to that endpoint.
// Otherwise it falls back to opening the user's mail client with
// a pre-filled message — so the site keeps working even on plain
// GitHub Pages with no backend.
// ---------------------------------------------------------------

// Set this to your Cloudflare Worker URL once deployed, e.g.
//   window.CONTACT_ENDPOINT = "https://chromo-contact.yourname.workers.dev";
window.CONTACT_ENDPOINT = window.CONTACT_ENDPOINT || "";

const form = document.getElementById("contact-form");
const status = document.getElementById("form-status");

function setStatus(msg, kind) {
  if (!status) return;
  status.textContent = msg || "";
  status.classList.remove("ok", "err");
  if (kind) status.classList.add(kind);
}

function buildMailtoFallback(data) {
  const subject = `Μήνυμα από ${data.name || "πελάτη"} (hromoepilogi.gr)`;
  const lines = [
    `Όνομα: ${data.name || ""}`,
    `Τηλέφωνο: ${data.phone || ""}`,
    `Email: ${data.email || ""}`,
    "",
    data.message || "",
  ];
  const body = lines.join("\n");
  return `mailto:info@hromoepilogi.gr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const data = {
      name:    (fd.get("name")    || "").toString().trim(),
      phone:   (fd.get("phone")   || "").toString().trim(),
      email:   (fd.get("email")   || "").toString().trim(),
      message: (fd.get("message") || "").toString().trim(),
      website: (fd.get("website") || "").toString().trim(), // honeypot
    };

    // honeypot — bots fill it, humans don't see it
    if (data.website) {
      setStatus("Το μήνυμα στάλθηκε. Ευχαριστούμε!", "ok");
      form.reset();
      return;
    }

    if (!data.name || !data.email || !data.message) {
      setStatus("Συμπληρώστε όνομα, email και μήνυμα.", "err");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setStatus("Ελέγξτε τη διεύθυνση email.", "err");
      return;
    }

    const submitBtn = form.querySelector("button[type=submit]");
    if (submitBtn) submitBtn.disabled = true;
    setStatus("Αποστολή…");

    // No backend configured → mailto fallback.
    if (!window.CONTACT_ENDPOINT) {
      window.location.href = buildMailtoFallback(data);
      setStatus("Ανοίγει το πρόγραμμα email σας…", "ok");
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    try {
      const res = await fetch(window.CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      form.reset();
      setStatus("Το μήνυμά σας στάλθηκε. Θα επικοινωνήσουμε σύντομα.", "ok");
    } catch (err) {
      console.error(err);
      setStatus("Κάτι πήγε στραβά. Δοκιμάστε ξανά ή στείλτε email στο info@hromoepilogi.gr.", "err");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
