const ATTENDANCE = new Set(["accept", "decline"]);
const LANGUAGES = new Set(["en", "th", "my"]);
const PAYMENT_METHODS = new Set(["promptpay", "kasikorn", "kpay"]);
const MAX_JSON_BODY_BYTES = 12_000;
const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const MAX_UPLOAD_BODY_BYTES = MAX_SLIP_BYTES + 64_000;

const json = (body, status, origin) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": origin,
    "vary": "Origin"
  }
});

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "https://librandshop.github.io")
    .split(",").map(value => value.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : "";
}

function clean(value, maxLength) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function markdown(value) {
  return value ? value.replace(/[<>|]/g, character => ({ "<": "&lt;", ">": "&gt;", "|": "\\|" })[character]) : "—";
}

function validate(payload) {
  const response = {
    name: clean(payload.name, 120), attendance: clean(payload.attendance, 12),
    partySize: Number(payload.partySize), plusOne: clean(payload.plusOne, 120),
    dietary: clean(payload.dietary, 700), language: clean(payload.language, 2),
    giftIntent: payload.giftIntent === true, giftPaymentMethod: clean(payload.giftPaymentMethod, 20),
    giftMessage: clean(payload.giftMessage, 700),
    website: clean(payload.website, 200), startedAt: Number(payload.startedAt)
  };
  if (response.website) return { error: "Unable to accept this response." };
  if (!response.name || response.name.length < 2) return { error: "Please enter your name." };
  if (!ATTENDANCE.has(response.attendance)) return { error: "Please choose whether you will attend." };
  if (!Number.isInteger(response.partySize) || response.partySize < 0 || response.partySize > 2) return { error: "Please choose a valid number of guests." };
  if (response.attendance === "accept" && response.partySize < 1) return { error: "Please select at least one attendee." };
  if (response.attendance === "accept" && response.partySize === 2 && !response.plusOne) return { error: "Please enter your plus-one's name." };
  if (response.attendance === "decline") {
    response.partySize = 0;
    response.plusOne = "";
    response.dietary = "";
  } else {
    response.giftIntent = false;
  }
  if (response.giftIntent && !PAYMENT_METHODS.has(response.giftPaymentMethod)) return { error: "Please choose a payment method." };
  if (!response.giftIntent) {
    response.giftPaymentMethod = "";
    response.giftMessage = "";
  }
  if (!LANGUAGES.has(response.language)) response.language = "en";
  if (!Number.isFinite(response.startedAt) || Date.now() - response.startedAt < 2500) return { error: "Please wait a moment and try again." };
  return { response };
}

const paymentName = method => ({ promptpay: "PromptPay", kasikorn: "Kasikorn Bank", kpay: "KPay" })[method] || "—";

function issueBody(rsvp, request, slipUrl = "") {
  const attendance = rsvp.attendance === "accept" ? "Joyfully accepts" : "Regretfully declines";
  const requestId = request.headers.get("cf-ray") || globalThis.crypto?.randomUUID?.() || `local-${Date.now()}`;
  return [
    "## Wedding RSVP", "", "| Field | Response |", "| --- | --- |",
    `| Guest | ${markdown(rsvp.name)} |`, `| Attendance | ${attendance} |`,
    `| Party size | ${rsvp.partySize} |`, `| Plus-one | ${markdown(rsvp.plusOne)} |`,
    `| Dietary requirements | ${markdown(rsvp.dietary)} |`,
    `| Wedding gift | ${rsvp.giftIntent ? "Yes" : "No"} |`,
    `| Payment method | ${paymentName(rsvp.giftPaymentMethod)} |`,
    `| Message to the couple | ${markdown(rsvp.giftMessage)} |`,
    `| Transfer slip | ${slipUrl ? `[View slip](${slipUrl})` : "—"} |`,
    `| Invitation language | ${rsvp.language.toUpperCase()} |`,
    `| Received | ${new Date().toISOString()} |`, "", `<sub>RSVP ID: ${requestId}</sub>`
  ].join("\n");
}

async function createGitHubIssue(rsvp, request, env, slipUrl) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPOSITORY) throw new Error("RSVP service is not configured.");
  const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues`, {
    method: "POST",
    headers: {
      "accept": "application/vnd.github+json", "authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "content-type": "application/json", "user-agent": "ye-and-nang-rsvp",
      "x-github-api-version": "2022-11-28"
    },
    body: JSON.stringify({
      title: `${rsvp.attendance === "accept" ? "Accepts" : "Declines"}: ${rsvp.name}`,
      body: issueBody(rsvp, request, slipUrl), labels: ["rsvp", rsvp.attendance === "accept" ? "attending" : "declined"]
    })
  });
  if (!response.ok) {
    console.error("GitHub issue creation failed", response.status, (await response.text()).slice(0, 500));
    throw new Error("Unable to save RSVP.");
  }
  return response.json();
}

async function parseSubmission(request) {
  const contentType = request.headers.get("content-type") || "";
  const contentLength = Number(request.headers.get("content-length") || 0);
  const multipart = contentType.toLowerCase().startsWith("multipart/form-data");
  const limit = multipart ? MAX_UPLOAD_BODY_BYTES : MAX_JSON_BODY_BYTES;
  if (!Number.isFinite(contentLength) || contentLength <= 0) return { error: "Content length is required.", status: 411 };
  if (contentLength > limit) return { error: multipart ? "Slip image is too large." : "Response is too large.", status: 413 };
  if (multipart) {
    const form = await request.formData();
    const raw = form.get("payload");
    if (typeof raw !== "string" || new TextEncoder().encode(raw).length > MAX_JSON_BODY_BYTES) return { error: "Invalid RSVP details.", status: 400 };
    const slip = form.get("slip");
    return { payload: JSON.parse(raw), slip: slip && typeof slip.arrayBuffer === "function" && slip.size ? slip : null };
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_JSON_BODY_BYTES) return { error: "Response is too large.", status: 413 };
  return { payload: JSON.parse(raw), slip: null };
}

async function inspectSlip(file) {
  if (file.size > MAX_SLIP_BYTES) return { error: "Slip image is too large." };
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.length >= 8 && [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((value, index) => bytes[index] === value);
  const webp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (jpeg) return { extension: "jpg", contentType: "image/jpeg" };
  if (png) return { extension: "png", contentType: "image/png" };
  if (webp) return { extension: "webp", contentType: "image/webp" };
  return { error: "Slip must be a JPG, PNG or WebP image." };
}

async function storeSlip(file, env) {
  if (!env.SLIPS) throw new Error("Slip storage is not configured.");
  const type = await inspectSlip(file);
  if (type.error) return type;
  const id = crypto.randomUUID();
  const key = `slips/${id}.${type.extension}`;
  await env.SLIPS.put(key, file, {
    httpMetadata: { contentType: type.contentType, contentDisposition: `inline; filename="wedding-slip.${type.extension}"` },
    customMetadata: { originalName: clean(file.name, 120), uploadedAt: new Date().toISOString() }
  });
  return { key, path: `/slip/${id}.${type.extension}` };
}

async function serveSlip(request, env) {
  const match = new URL(request.url).pathname.match(/^\/slip\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/i);
  if (!match || !env.SLIPS) return new Response("Not found", { status: 404 });
  const object = await env.SLIPS.get(`slips/${match[1].toLowerCase()}`);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers({ "cache-control": "private, no-store", "x-content-type-options": "nosniff", "x-robots-tag": "noindex, nofollow" });
  object.writeHttpMetadata(headers);
  return new Response(object.body, { headers });
}

export default {
  async fetch(request, env) {
    if (request.method === "GET" && new URL(request.url).pathname.startsWith("/slip/")) return serveSlip(request, env);
    const origin = allowedOrigin(request, env);
    if (!origin) return new Response("Forbidden", { status: 403 });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
      "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type", "access-control-max-age": "86400", "vary": "Origin"
    }});
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405, origin);
    let storedSlip;
    try {
      const submission = await parseSubmission(request);
      if (submission.error) return json({ ok: false, error: submission.error }, submission.status, origin);
      const result = validate(submission.payload);
      if (result.error) return json({ ok: false, error: result.error }, 400, origin);
      if (submission.slip && !result.response.giftIntent) return json({ ok: false, error: "A slip can only be attached to a wedding gift." }, 400, origin);
      if (submission.slip) {
        storedSlip = await storeSlip(submission.slip, env);
        if (storedSlip.error) return json({ ok: false, error: storedSlip.error }, 400, origin);
      }
      const slipUrl = storedSlip ? `${new URL(request.url).origin}${storedSlip.path}` : "";
      const issue = await createGitHubIssue(result.response, request, env, slipUrl);
      return json({ ok: true, reference: issue.number }, 201, origin);
    } catch (error) {
      if (storedSlip?.key && env.SLIPS) {
        try { await env.SLIPS.delete(storedSlip.key); } catch (cleanupError) { console.error("Slip cleanup failed", cleanupError); }
      }
      console.error(error);
      return json({ ok: false, error: "We could not save your RSVP. Please try again." }, 500, origin);
    }
  }
};

