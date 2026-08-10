import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { markSentUrls, readState, unseenArticles, writeStateAtomic } from "../scripts/lib/state-store.mjs";

test("state filters URL variants and persists canonical URLs atomically", async () => {
  const dir = await mkdtemp(join(tmpdir(), "slimai-state-"));
  try {
    const path = join(dir, "state.json");
    await writeStateAtomic(path, markSentUrls({}, ["https://EXAMPLE.com/a/?utm_source=rss"]));
    const state = await readState(path);
    const unseen = unseenArticles([
      { title: "sent", link: "https://example.com/a" },
      { title: "new", link: "https://example.com/b#section" },
      { title: "duplicate", link: "https://example.com/b#section" },
    ], state);
    assert.deepEqual(state.sentUrls, ["https://example.com/a"]);
    assert.equal(unseen.length, 1);
    assert.equal(unseen[0].link, "https://example.com/b#section");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

