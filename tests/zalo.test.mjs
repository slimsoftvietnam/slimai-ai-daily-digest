import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildPayload, sendZaloDigest, splitZaloText } from "../scripts/send-zalo.mjs";

test("Zalo payload text stays a primitive string and long messages split", () => {
  const built = buildPayload("Xin chào group");
  assert.equal(typeof built.parsed.text, "string");
  const parts = splitZaloText(`${"Dòng tin quan trọng\n".repeat(40)}CTA\nhttps://example.com/blog`, 220);
  assert.ok(parts.length > 1);
  assert.ok(parts.every((part) => part.length <= 220));
  assert.ok(parts.at(-1).endsWith("https://example.com/blog"));
});

test("Zalo delivery is split, recorded, and skipped on a second run", async () => {
  const dir = await mkdtemp(join(tmpdir(), "slimai-zalo-"));
  try {
    const file = join(dir, "message.txt");
    const statePath = join(dir, "state.json");
    await writeFile(file, `${"• Nội dung dễ hiểu\n".repeat(30)}👉 Xem chi tiết:\nhttps://example.com/blog`, "utf8");
    let calls = 0;
    const fetchImpl = async (_url, request) => {
      calls += 1;
      const body = JSON.parse(request.body);
      assert.equal(typeof body.text, "string");
      assert.ok(request.headers["X-Idempotency-Key"]);
      return new Response(JSON.stringify({ ok: true, result: { ok: true, result: { message_id: `m${calls}` } } }), { status: 200 });
    };
    const options = { file, blogUrl: "https://example.com/blog", statePath, maxChars: 240, endpoint: "https://zalo.example/api", apiKey: "secret", fetchImpl };
    const first = await sendZaloDigest(options);
    assert.ok(first.parts > 1);
    assert.equal(first.messageIds.length, first.parts);
    const before = calls;
    const second = await sendZaloDigest(options);
    assert.equal(second.skipped, true);
    assert.equal(calls, before);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("ambiguous Zalo response is not resent automatically", async () => {
  const dir = await mkdtemp(join(tmpdir(), "slimai-zalo-ambiguous-"));
  try {
    const file = join(dir, "message.txt");
    const statePath = join(dir, "state.json");
    await writeFile(file, "Nội dung\nhttps://example.com/ambiguous", "utf8");
    let calls = 0;
    const options = { file, blogUrl: "https://example.com/ambiguous", statePath, maxChars: 500, endpoint: "https://zalo.example/api", apiKey: "secret", fetchImpl: async () => { calls += 1; throw new Error("connection reset"); } };
    await assert.rejects(sendZaloDigest(options), /pending/);
    await assert.rejects(sendZaloDigest(options), /ambiguous previous delivery/);
    assert.equal(calls, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

