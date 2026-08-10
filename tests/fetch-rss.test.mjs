import assert from "node:assert/strict";
import test from "node:test";
import { fetchFeed, parseFeed } from "../scripts/fetch-rss.mjs";

const rss = `<?xml version="1.0"?><rss><channel><item><title>AI &amp; Test</title><link>https://example.com/a?utm_source=rss</link><pubDate>Sun, 09 Aug 2026 01:00:00 GMT</pubDate><description>Useful update</description></item></channel></rss>`;

test("parseFeed rejects broken RSS and canonicalizes article links", () => {
  assert.throws(() => parseFeed("not xml", { xmlUrl: "https://example.com/feed", name: "x" }), /Invalid RSS/);
  const items = parseFeed(rss, { xmlUrl: "https://example.com/feed", htmlUrl: "https://example.com", name: "Example" }, 0);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "AI & Test");
  assert.equal(items[0].link, "https://example.com/a");
});

test("fetchFeed retries transient HTTP errors", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return calls === 1 ? new Response("busy", { status: 503 }) : new Response(rss, { status: 200 });
  };
  const body = await fetchFeed("https://example.com/feed", { fetchImpl, retries: 1, timeoutMs: 1000 });
  assert.equal(body, rss);
  assert.equal(calls, 2);
});

test("fetchFeed does not retry permanent 404", async () => {
  let calls = 0;
  await assert.rejects(
    fetchFeed("https://example.com/missing", { fetchImpl: async () => { calls += 1; return new Response("missing", { status: 404 }); }, retries: 2, timeoutMs: 1000 }),
    /HTTP 404/,
  );
  assert.equal(calls, 1);
});

