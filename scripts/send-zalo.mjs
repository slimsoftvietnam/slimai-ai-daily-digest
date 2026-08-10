#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { readState, withStateLock } from "./lib/state-store.mjs";
import { canonicalizeUrl } from "./lib/url.mjs";

function wordsToLines(line, maxChars) {
  if (line.length <= maxChars) return [line];
  const output = [];
  let current = "";
  for (const word of line.split(/\s+/)) {
    if (word.length > maxChars) {
      if (current) output.push(current);
      for (let offset = 0; offset < word.length; offset += maxChars) output.push(word.slice(offset, offset + maxChars));
      current = "";
      continue;
    }
    if (!current) current = word;
    else if (`${current} ${word}`.length <= maxChars) current += ` ${word}`;
    else {
      output.push(current);
      current = word;
    }
  }
  if (current) output.push(current);
  return output;
}

export function splitZaloText(text, maxChars = 1800) {
  const clean = String(text ?? "").replace(/\r\n/g, "\n").trim();
  if (!clean) throw new Error("Zalo payload rejected: text must be a non-empty string");
  if (!Number.isInteger(maxChars) || maxChars < 200) throw new Error("maxChars must be an integer of at least 200");
  if (clean.length <= maxChars) return [clean];

  const reserve = 24;
  const limit = maxChars - reserve;
  const units = clean.split("\n").flatMap((line) => wordsToLines(line, limit));
  const chunks = [];
  let current = "";
  for (const unit of units) {
    const candidate = current ? `${current}\n${unit}` : unit;
    if (candidate.length <= limit) current = candidate;
    else {
      if (current) chunks.push(current.trim());
      current = unit;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks.map((chunk, index) => `Phần ${index + 1}/${chunks.length}\n\n${chunk}`);
}

export function buildPayload(text) {
  const json = JSON.stringify({ text });
  const parsed = JSON.parse(json);
  if (typeof parsed.text !== "string" || parsed.text.trim() === "") {
    throw new Error("Zalo payload rejected after JSON serialization");
  }
  return { json, parsed };
}

function extractMessageId(data) {
  return data?.result?.result?.message_id
    ?? data?.result?.message_id
    ?? data?.message_id
    ?? data?.messageId;
}

function responseAccepted(response, data) {
  const nestedOk = data?.result?.ok;
  return response.ok && data?.ok === true && (nestedOk === undefined || nestedOk === true);
}

function idempotencyKey(blogUrl, index, text) {
  return createHash("sha256").update(`${blogUrl}\n${index}\n${text}`).digest("hex");
}

export async function postZaloPart({ endpoint, apiKey, text, key, fetchImpl = fetch, timeoutMs = 20000 }) {
  const { json } = buildPayload(text);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Api-Key": apiKey,
        "X-Idempotency-Key": key,
      },
      body: json,
    });
    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = null; }
    const messageId = extractMessageId(data);
    if (!responseAccepted(response, data) || !messageId) {
      throw new Error(`HTTP ${response.status}; no confirmed message ID`);
    }
    return String(messageId);
  } finally {
    clearTimeout(timer);
  }
}

function argValue(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

export async function sendZaloDigest(options) {
  const text = await readFile(options.file, "utf8");
  const parts = splitZaloText(text, options.maxChars);
  for (const part of parts) buildPayload(part);
  if (options.dryRun) {
    return { ok: true, dryRun: true, characters: text.trim().length, parts: parts.length, partCharacters: parts.map((part) => part.length) };
  }
  if (!options.endpoint || !options.apiKey) throw new Error("Missing SLIMAI_ZALO_BOT_ENDPOINT or SLIMAI_ZALO_BOT_API_KEY");
  const blogUrl = canonicalizeUrl(options.blogUrl);
  if (!blogUrl || !options.statePath) throw new Error("Live send requires --blog-url and --state");

  const existing = await readState(options.statePath);
  if (existing.zaloSentBlogUrls.includes(blogUrl) && !options.force) {
    return { ok: true, skipped: true, reason: "already_sent", blogUrl, parts: 0, messageIds: [] };
  }

  const deliveryId = createHash("sha256").update(blogUrl).digest("hex").slice(0, 24);
  const messageIds = [];
  for (let index = 0; index < parts.length; index += 1) {
    const partNumber = String(index + 1);
    const key = idempotencyKey(blogUrl, index, parts[index]);
    const decision = await withStateLock(options.statePath, async (state) => {
      state.zaloDeliveries[deliveryId] ??= { blogUrl, status: "sending", parts: {}, createdAt: new Date().toISOString() };
      const delivery = state.zaloDeliveries[deliveryId];
      const prior = delivery.parts[partNumber];
      if (prior?.status === "sent") return { state, value: { action: "skip", messageId: prior.messageId } };
      if (prior?.status === "pending" && !options.resumeAmbiguous) {
        return { state, value: { action: "ambiguous", key: prior.idempotencyKey } };
      }
      delivery.parts[partNumber] = { status: "pending", idempotencyKey: key, textHash: createHash("sha256").update(parts[index]).digest("hex"), updatedAt: new Date().toISOString() };
      return { state, value: { action: "send" } };
    });

    if (decision.action === "ambiguous") {
      throw new Error(`Part ${partNumber} has an ambiguous previous delivery. Confirm externally, then use --resume-ambiguous to retry with the same idempotency key.`);
    }
    if (decision.action === "skip") {
      messageIds.push(String(decision.messageId));
      continue;
    }

    let messageId;
    try {
      messageId = await postZaloPart({ ...options, text: parts[index], key });
    } catch (error) {
      throw new Error(`Zalo part ${partNumber}/${parts.length} is pending because delivery was not confirmed: ${error.message}`);
    }
    messageIds.push(messageId);
    await withStateLock(options.statePath, async (state) => {
      const delivery = state.zaloDeliveries[deliveryId];
      delivery.parts[partNumber] = { ...delivery.parts[partNumber], status: "sent", messageId, sentAt: new Date().toISOString() };
      state.lastZaloMessageId = messageId;
      state.lastZaloRunAt = new Date().toISOString();
      return { state };
    });
  }

  await withStateLock(options.statePath, async (state) => {
    const delivery = state.zaloDeliveries[deliveryId];
    delivery.status = "complete";
    delivery.completedAt = new Date().toISOString();
    delivery.messageIds = messageIds;
    state.zaloSentBlogUrls = [...new Set([...state.zaloSentBlogUrls, blogUrl])];
    return { state };
  });
  return { ok: true, blogUrl, characters: text.trim().length, parts: parts.length, messageIds };
}

export async function main(argv = process.argv.slice(2)) {
  const file = argValue(argv, "--file");
  if (!file) throw new Error("Usage: send-zalo.mjs --file <message.txt> [--blog-url URL --state file] [--dry-run]");
  const result = await sendZaloDigest({
    file: resolve(file),
    blogUrl: argValue(argv, "--blog-url"),
    statePath: argValue(argv, "--state"),
    maxChars: Number.parseInt(argValue(argv, "--max-chars", process.env.SLIMAI_ZALO_MAX_CHARS || "1800"), 10),
    dryRun: argv.includes("--dry-run"),
    force: argv.includes("--force"),
    resumeAmbiguous: argv.includes("--resume-ambiguous"),
    endpoint: process.env.SLIMAI_ZALO_BOT_ENDPOINT,
    apiKey: process.env.SLIMAI_ZALO_BOT_API_KEY,
  });
  console.log(JSON.stringify(result));
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`[send-zalo] ${error.message}`);
    process.exit(1);
  });
}
