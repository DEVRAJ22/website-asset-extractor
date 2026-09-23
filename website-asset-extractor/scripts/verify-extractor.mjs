import assert from "node:assert/strict";

// Inline copies of pure URL helpers for quick verification.

function normalizeUrlKey(url) {
  const parsed = new URL(url);
  parsed.hash = "";
  const host = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return `${parsed.protocol}//${host}${pathname}${parsed.search}`;
}

function parseSrcSet(srcset, baseUrl) {
  return srcset.split(",").map((p) => p.trim()).filter(Boolean).map((part) => {
    const tokens = part.split(/\s+/);
    const resolved = new URL(tokens[0], baseUrl).href;
    const width = tokens[1]?.endsWith("w") ? parseInt(tokens[1], 10) : undefined;
    return { url: resolved, width };
  });
}

function pickBest(candidates) {
  return candidates.reduce((best, cur) => ((cur.width ?? 0) > (best.width ?? 0) ? cur : best));
}

// relative URL
assert.equal(new URL("/img/a.png", "https://example.com/page").href, "https://example.com/img/a.png");

// srcset
const candidates = parseSrcSet("/a-320w.jpg 320w, /a-640w.jpg 640w", "https://example.com");
assert.equal(pickBest(candidates).url, "https://example.com/a-640w.jpg");

// dedupe key
assert.equal(
  normalizeUrlKey("https://Example.com/x.png#frag"),
  normalizeUrlKey("https://example.com/x.png"),
);

console.log("verify-extractor: OK");
