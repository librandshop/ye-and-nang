import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const storedObjects = new Map();
const slips = {
  async put(key, value, options) {
    storedObjects.set(key, { body: value, options });
  },
  async get(key) {
    const stored = storedObjects.get(key);
    if (!stored) return null;
    return {
      body: stored.body,
      writeHttpMetadata(headers) {
        headers.set("content-type", stored.options.httpMetadata.contentType);
        headers.set("content-disposition", stored.options.httpMetadata.contentDisposition);
      }
    };
  },
  async delete(key) {
    storedObjects.delete(key);
  }
};

const env = {
  ALLOWED_ORIGINS: "https://librandshop.github.io",
  GITHUB_TOKEN: "test-token",
  GITHUB_REPOSITORY: "librandshop/ye-and-nang-rsvp",
  SLIPS: slips
};

function invitationRequest(body, origin = "https://librandshop.github.io") {
  const encoded = JSON.stringify(body);
  return new Request("https://rsvp.example.workers.dev", {
    method: "POST",
    headers: { "content-type": "application/json", "content-length": String(new TextEncoder().encode(encoded).length), Origin: origin },
    body: encoded
  });
}

function multipartRequest(payload, file) {
  const form = new FormData();
  form.append("payload", JSON.stringify(payload));
  form.append("slip", file, file.name);
  return new Request("https://rsvp.example.workers.dev", {
    method: "POST",
    headers: { "content-length": String(file.size + 2048), Origin: "https://librandshop.github.io" },
    body: form
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

test("declined guest can record a wedding gift without a slip", async () => {
  const originalFetch = globalThis.fetch;
  let issue;
  globalThis.fetch = async (_url, options) => {
    issue = JSON.parse(options.body);
    return new Response(JSON.stringify({ number: 43 }), { status: 201 });
  };
  try {
    const response = await worker.fetch(invitationRequest({
      name: "Kind Guest", attendance: "decline", partySize: "0", language: "th",
      giftIntent: true, giftPaymentMethod: "promptpay", giftMessage: "Wishing you a lifetime of joy!",
      website: "", startedAt: Date.now() - 5000
    }), env);
    assert.equal(response.status, 201);
    assert.match(issue.body, /\| Wedding gift \| Yes \|/);
    assert.match(issue.body, /\| Payment method \| PromptPay \|/);
    assert.match(issue.body, /\| Message to the couple \| Wishing you a lifetime of joy! \|/);
    assert.match(issue.body, /\| Transfer slip \| — \|/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("valid slip is stored privately and linked from the GitHub issue", async () => {
  storedObjects.clear();
  const originalFetch = globalThis.fetch;
  let issue;
  globalThis.fetch = async (_url, options) => {
    issue = JSON.parse(options.body);
    return new Response(JSON.stringify({ number: 44 }), { status: 201 });
  };
  try {
    const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x01])], "receipt.jpg", { type: "image/jpeg" });
    const response = await worker.fetch(multipartRequest({
      name: "Slip Guest", attendance: "decline", partySize: "0", language: "my",
      giftIntent: true, giftPaymentMethod: "kasikorn", website: "", startedAt: Date.now() - 5000
    }, jpeg), env);
    assert.equal(response.status, 201);
    assert.equal(storedObjects.size, 1);
    const [[key, stored]] = storedObjects.entries();
    assert.match(key, /^slips\/[0-9a-f-]{36}\.jpg$/);
    assert.equal(stored.options.httpMetadata.contentType, "image/jpeg");
    assert.match(issue.body, /\| Payment method \| Kasikorn Bank \|/);
    assert.match(issue.body, /\[View slip\]\(https:\/\/rsvp\.example\.workers\.dev\/slip\/[0-9a-f-]{36}\.jpg\)/);

    const publicPath = issue.body.match(/https:\/\/rsvp\.example\.workers\.dev\/slip\/[0-9a-f-]{36}\.jpg/)[0];
    const slipResponse = await worker.fetch(new Request(publicPath), env);
    assert.equal(slipResponse.status, 200);
    assert.equal(slipResponse.headers.get("content-type"), "image/jpeg");
    assert.equal(slipResponse.headers.get("x-robots-tag"), "noindex, nofollow");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("files with a false image type are rejected", async () => {
  const fake = new File(["not really an image"], "fake.png", { type: "image/png" });
  const response = await worker.fetch(multipartRequest({
    name: "Careful Guest", attendance: "decline", partySize: "0", language: "en",
    giftIntent: true, giftPaymentMethod: "kpay", website: "", startedAt: Date.now() - 5000
  }, fake), env);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /JPG, PNG or WebP/);
});

test("stored slip is removed when GitHub recording fails", async () => {
  storedObjects.clear();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("failure", { status: 500 });
  try {
    const png = new File([new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])], "receipt.png", { type: "image/png" });
    const response = await worker.fetch(multipartRequest({
      name: "Cleanup Guest", attendance: "decline", partySize: "0", language: "en",
      giftIntent: true, giftPaymentMethod: "kpay", website: "", startedAt: Date.now() - 5000
    }, png), env);
    assert.equal(response.status, 500);
    assert.equal(storedObjects.size, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

