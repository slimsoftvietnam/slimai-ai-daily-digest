#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";

function fail(message) {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const fileIndex = args.indexOf("--file");
const filePath = fileIndex >= 0 ? args[fileIndex + 1] : undefined;
const dryRun = args.includes("--dry-run");

if (!filePath) {
  fail("Usage: node send-zalo.mjs --file <message.txt> [--dry-run]");
}

const text = await readFile(filePath, "utf8");
if (typeof text !== "string" || text.trim().length === 0) {
  fail("Zalo payload rejected locally: text must be a non-empty string.");
}

const payload = { text };
const json = JSON.stringify(payload);
const parsed = JSON.parse(json);
if (typeof parsed.text !== "string" || parsed.text.trim().length === 0) {
  fail("Zalo payload rejected locally after JSON serialization.");
}

if (dryRun) {
  console.log(JSON.stringify({ ok: true, dryRun: true, characters: text.length }));
  process.exit(0);
}

const endpoint = process.env.SLIMAI_ZALO_BOT_ENDPOINT;
const apiKey = process.env.SLIMAI_ZALO_BOT_API_KEY;
if (!endpoint || !apiKey) {
  fail("Missing SLIMAI_ZALO_BOT_ENDPOINT or SLIMAI_ZALO_BOT_API_KEY.");
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "X-Api-Key": apiKey,
  },
  body: json,
});

const raw = await response.text();
let data;
try {
  data = JSON.parse(raw);
} catch {
  data = null;
}

const accepted = response.ok && data?.ok === true && data?.result?.ok === true;
const messageId = data?.result?.result?.message_id;
if (!accepted || !messageId) {
  fail(`Zalo delivery failed: HTTP ${response.status}; no confirmed message ID.`);
}

console.log(JSON.stringify({ ok: true, messageId, characters: text.length }));
