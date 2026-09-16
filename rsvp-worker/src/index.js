const ATTENDANCE = new Set(["accept", "decline"]);
const LANGUAGES = new Set(["en", "th", "my"]);
const MAX_BODY_BYTES = 12_000;

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
    website: clean(payload.website, 200), startedAt: Number(payload.startedAt)
  };
  if (response.website) return { error: "Unable to accept this response." };
  if (!response.name || response.name.length < 2) return { error: "Please enter your name." };
  if (!ATTENDANCE.has(response.attendance)) return { error: "Please choose whether you will attend." };
  if (!Number.isInteger(response.partySize) || response.partySize < 0 || response.partySize > 2) return { error: "Please choose a valid number of guests." };
  if (response.attendance === "accept" && response.partySize < 1) return { error: "Please select at least one attendee." };
  if (response.attendance === "decline") response.partySize = 0;
  if (!LANGUAGES.has(response.language)) response.language = "en";
  if (!Number.isFinite(response.startedAt) || Date.now() - response.startedAt < 2500) return { error: "Please wait a moment and try again." };
  return { response };
}

function issueBody(rsvp, request) {
  const attendance = rsvp.attendance === "accept" ? "Joyfully accepts" : "Regretfully declines";
  const requestId = request.headers.get("cf-ray") || globalThis.crypto?.randomUUID?.() || `local-${Date.now()}`;
  return [
    "## Wedding RSVP", "", "| Field | Response |", "| --- | --- |",
    `| Guest | ${markdown(rsvp.name)} |`, `| Attendance | ${attendance} |`,
    `| Party size | ${rsvp.partySize} |`, `| Plus-one | ${markdown(rsvp.plusOne)} |`,
    `| Dietary requirements | ${markdown(rsvp.dietary)} |`,
    `| Invitation language | ${rsvp.language.toUpperCase()} |`,
    `| Received | ${new Date().toISOString()} |`, "", `<sub>RSVP ID: ${requestId}</sub>`
  ].join("\n");
}

async function createGitHubIssue(rsvp, request, env) {
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
      body: issueBody(rsvp, request), labels: ["rsvp", rsvp.attendance === "accept" ? "attending" : "declined"]
    })
  });
  if (!response.ok) {
    console.error("GitHub issue creation failed", response.status, (await response.text()).slice(0, 500));
    throw new Error("Unable to save RSVP.");
  }
  return response.json();
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (!origin) return new Response("Forbidden", { status: 403 });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
      "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type", "access-control-max-age": "86400", "vary": "Origin"
    }});
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405, origin);
    if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) return json({ ok: false, error: "Response is too large." }, 413, origin);
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return json({ ok: false, error: "Response is too large." }, 413, origin);
      const result = validate(JSON.parse(raw));
      if (result.error) return json({ ok: false, error: result.error }, 400, origin);
      const issue = await createGitHubIssue(result.response, request, env);
      return json({ ok: true, reference: issue.number }, 201, origin);
    } catch (error) {
      console.error(error);
      return json({ ok: false, error: "We could not save your RSVP. Please try again." }, 500, origin);
    }
  }
};
