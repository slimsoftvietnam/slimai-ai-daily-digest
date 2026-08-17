import test from "node:test";
import assert from "node:assert/strict";
import { versionedFeaturedSourceUrl } from "../scripts/lib/asset-version.mjs";

test("featured image source URL changes when image bytes change", () => {
  const first = versionedFeaturedSourceUrl("https://ai.slim.vn", Buffer.from("cover-one"));
  const second = versionedFeaturedSourceUrl("https://ai.slim.vn", Buffer.from("cover-two"));

  assert.notEqual(first, second);
  assert.match(first, /^https:\/\/ai\.slim\.vn\?slimai_cover_sha256=[a-f0-9]{16}$/);
});

test("featured image version preserves an existing query string", () => {
  const value = versionedFeaturedSourceUrl("https://ai.slim.vn/cover.jpg?size=large", Buffer.from("cover"));

  assert.match(value, /\?size=large&slimai_cover_sha256=[a-f0-9]{16}$/);
});
