import assert from "node:assert/strict";
import test from "node:test";
import { canonicalizeUrl, dedupeArticles } from "../scripts/lib/url.mjs";

test("canonicalizeUrl removes tracking and generic feed fragments", () => {
  assert.equal(
    canonicalizeUrl("HTTPS://Example.COM:443/path/?utm_source=rss&b=2&a=1#atom-everything"),
    "https://example.com/path?a=1&b=2",
  );
});

test("canonicalizeUrl preserves semantic release-note anchors", () => {
  assert.equal(
    canonicalizeUrl("https://example.com/changelog/#version-2"),
    "https://example.com/changelog#version-2",
  );
});

test("dedupeArticles removes canonical URL and normalized-title duplicates", () => {
  const articles = dedupeArticles([
    { title: "New AI model", link: "https://example.com/a?utm_source=x" },
    { title: "New AI model!", link: "https://mirror.example.com/story" },
    { title: "Different story", link: "https://example.com/a" },
  ]);
  assert.equal(articles.length, 1);
  assert.equal(articles[0].link, "https://example.com/a");
});

