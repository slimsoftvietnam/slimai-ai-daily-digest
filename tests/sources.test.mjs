import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function load(name) {
  return JSON.parse(await readFile(new URL(`../references/${name}`, import.meta.url), "utf8"));
}

function assertUnique(items, field) {
  const values = items.map((item) => item[field]);
  assert.equal(new Set(values).size, values.length, `${field} values must be unique within the allowlist`);
}

test("source allowlists are valid and contain the selected additions", async () => {
  const [community, official, strategic] = await Promise.all([
    load("sources.json"),
    load("official-sources.json"),
    load("strategic-sources.json"),
  ]);

  assertUnique(community, "xmlUrl");
  assertUnique(official, "url");
  assertUnique(strategic, "url");
  for (const source of community) {
    assert.match(source.xmlUrl, /^https:\/\//);
    assert.match(source.htmlUrl, /^https:\/\//);
  }

  for (const platform of ["Mistral AI", "Meta AI", "NVIDIA", "AWS AI"]) {
    assert.ok(official.some((source) => source.platform === platform), `missing official source: ${platform}`);
  }
  assert.ok(strategic.some((source) => source.organization === "Stanford Institute for Human-Centered AI"));
  assert.ok(community.some((source) => source.name === "Hugging Face Blog"));
});
