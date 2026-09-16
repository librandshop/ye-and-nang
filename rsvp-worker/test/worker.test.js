import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const env = {
  ALLOWED_ORIGINS: "https://librandshop.github.io",
  GITHUB_TOKEN: "test-token",
  GITHUB_REPOSITORY: "librandshop/ye-and-nang-rsvp"
};

function invitationRequest(body, origin = "https://librandshop.github.io") {
  return new Request("https://rsvp.example.workers.dev", {
    method: "POST",
    headers: { "content-type": "application/json", Origin: origin },
    body: JSON.stringify(body)
  });
}

test("valid RSVP creates a private GitHub issue payload", async () => {
  const originalFetch = globalThis.fetch;
  let githubRequest;
  globalThis.fetch = async (url, options) => {
    githubRequest = { url, options };
    return new Response(JSON.stringify({ number: 42 }), { status: 201, headers: { "content-type": "application/json" } });
  };
  try {
    const response = await worker.fetch(invitationRequest({
      name: "Website Test", attendance: "accept", partySize: "2", plusOne: "Guest Two",
      dietary: "No peanuts", language: "en", website: "", startedAt: Date.now() - 5000
    }), env);
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { ok: true, reference: 42 });
    assert.equal(githubRequest.url, "https://api.github.com/repos/librandshop/ye-and-nang-rsvp/issues");
    const issue = JSON.parse(githubRequest.options.body);
    assert.equal(issue.title, "Accepts: Website Test");
    assert.match(issue.body, /No peanuts/);
    assert.deepEqual(issue.labels, ["rsvp", "attending"]);
    assert.equal(githubRequest.options.headers.authorization, "Bearer test-token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("honeypot submissions are rejected before GitHub", async () => {
  const response = await worker.fetch(invitationRequest({
    name: "Spam Bot", attendance: "accept", partySize: 1, website: "spam.example",
    startedAt: Date.now() - 5000
  }), env);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).ok, false);
});

test("unknown origins are forbidden", async () => {
  const response = await worker.fetch(invitationRequest({
    name: "Guest", attendance: "decline", partySize: 0, website: "",
    startedAt: Date.now() - 5000
  }, "https://malicious.example"), env);
  assert.equal(response.status, 403);
});
