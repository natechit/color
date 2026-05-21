/**
 * Χρωμοεπιλογή — contact form Worker
 *
 * Receives JSON { name, phone, email, message } from the site,
 * validates, and forwards it as email via Resend.
 *
 * Env bindings (wrangler secret put / wrangler.toml [vars]):
 *   RESEND_API_KEY   — secret, from https://resend.com
 *   FROM_EMAIL       — verified Resend sender, e.g. "site@hromoepilogi.gr"
 *   TO_EMAIL         — destination, e.g. "info@hromoepilogi.gr"
 *   ALLOWED_ORIGIN   — e.g. "https://www.hromoepilogi.gr"
 *
 * Optional KV binding:
 *   RATE_LIMIT       — KV namespace for simple per-IP throttling
 */

const CORS_HEADERS = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
});

function json(data, init = {}, origin = "*") {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS(origin),
      ...(init.headers || {}),
    },
  });
}

function isEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 254;
}
function clean(s, max = 2000) {
  return (typeof s === "string" ? s : "").trim().slice(0, max);
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";
    const origin = request.headers.get("Origin") || "";
    const corsOrigin = (allowedOrigin === "*" || origin === allowedOrigin) ? (origin || allowedOrigin) : allowedOrigin;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS(corsOrigin) });
    }
    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, { status: 405 }, corsOrigin);
    }
    if (allowedOrigin !== "*" && origin !== allowedOrigin) {
      return json({ error: "forbidden" }, { status: 403 }, corsOrigin);
    }

    // Simple per-IP rate limit (5 / hour) if a KV namespace is bound.
    const ip = request.headers.get("CF-Connecting-IP") || "anon";
    if (env.RATE_LIMIT) {
      const key = `c:${ip}`;
      const hits = parseInt((await env.RATE_LIMIT.get(key)) || "0", 10);
      if (hits >= 5) {
        return json({ error: "rate_limited" }, { status: 429 }, corsOrigin);
      }
      await env.RATE_LIMIT.put(key, String(hits + 1), { expirationTtl: 3600 });
    }

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "bad_json" }, { status: 400 }, corsOrigin); }

    // honeypot
    if (clean(body.website)) {
      return json({ ok: true }, { status: 200 }, corsOrigin);
    }

    const name    = clean(body.name, 120);
    const phone   = clean(body.phone, 60);
    const email   = clean(body.email, 200);
    const message = clean(body.message, 4000);

    if (!name || !message || !isEmail(email)) {
      return json({ error: "invalid_input" }, { status: 400 }, corsOrigin);
    }

    if (!env.RESEND_API_KEY || !env.FROM_EMAIL || !env.TO_EMAIL) {
      return json({ error: "not_configured" }, { status: 500 }, corsOrigin);
    }

    const subject = `Νέο μήνυμα από ${name} — hromoepilogi.gr`;
    const text = [
      `Όνομα: ${name}`,
      `Email: ${email}`,
      `Τηλέφωνο: ${phone || "—"}`,
      ``,
      message,
    ].join("\n");

    const html = `
      <table style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#1a1714;">
        <tr><td><strong>Όνομα</strong></td><td>${escapeHtml(name)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
        <tr><td><strong>Τηλέφωνο</strong></td><td>${escapeHtml(phone || "—")}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;">
      <p style="white-space:pre-wrap;font-family:system-ui,-apple-system,sans-serif;color:#1a1714;">${escapeHtml(message)}</p>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [env.TO_EMAIL],
        reply_to: email,
        subject,
        text,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("resend_failed", resendRes.status, errBody);
      return json({ error: "send_failed" }, { status: 502 }, corsOrigin);
    }

    return json({ ok: true }, { status: 200 }, corsOrigin);
  },
};
