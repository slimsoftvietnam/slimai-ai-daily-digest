#!/usr/bin/env node
/** Concurrent zero-dependency RSS/Atom fetcher for Node.js 18+. */
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readState, writeStateAtomic } from "./lib/state-store.mjs";
import { canonicalizeUrl, dedupeArticles } from "./lib/url.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const MAX_FEED_BYTES = 5 * 1024 * 1024;
const USER_AGENT = "SlimAI-Daily-Digest/2.0 (+https://github.com/slimsoftvietnam/slimai-ai-daily-digest)";

export function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function extractAllBlocks(xml, tag) {
  return xml.match(new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, "gi")) || [];
}

function resolveHttpUrl(value, baseUrl) {
  try {
    const url = new URL(value, baseUrl);
    return canonicalizeUrl(url.href);
  } catch {
    return "";
  }
}

function extractLink(block, baseUrl) {
  const atom = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']alternate["']/i)
    || block.match(/<link[^>]+rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
    || block.match(/<link[^>]+href=["']([^"']+)["'][^>]*/i);
  if (atom) return resolveHttpUrl(atom[1], baseUrl);
  const rss = block.match(/<link>([\s\S]*?)<\/link>/i);
  return rss ? resolveHttpUrl(rss[1].trim(), baseUrl) : "";
}

function decodeEntities(value) {
  return String(value ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function parseFeed(xml, source, cutoffMs = 0) {
  if (typeof xml !== "string" || !/<(?:rss|feed|rdf:RDF)\b/i.test(xml)) {
    throw new Error("Invalid RSS/Atom document");
  }
  let entries = extractAllBlocks(xml, "entry");
  let format = "atom";
  if (entries.length === 0) {
    entries = extractAllBlocks(xml, "item");
    format = "rss";
  }
  const articles = [];
  for (const entry of entries) {
    const title = decodeEntities(extractTag(entry, "title"));
    const link = extractLink(entry, source.xmlUrl);
    const published = extractTag(entry, format === "atom" ? "published" : "pubDate")
      || extractTag(entry, "updated")
      || extractTag(entry, "dc:date");
    const timestamp = Date.parse(decodeEntities(published));
    if (!title || !link || !Number.isFinite(timestamp) || timestamp < cutoffMs) continue;
    articles.push({
      title,
      link,
      summary: decodeEntities(extractTag(entry, "summary") || extractTag(entry, "description")).slice(0, 500),
      timestamp,
      date: new Date(timestamp).toISOString(),
      source: source.name,
      sourceUrl: canonicalizeUrl(source.htmlUrl),
    });
  }
  return articles;
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

export async function fetchFeed(url, { timeoutMs = 15000, retries = 2, fetchImpl = fetch } = {}) {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(`Unsupported URL protocol: ${parsed.protocol}`);
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, { signal: controller.signal, headers: { "User-Agent": USER_AGENT } });
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.permanent = response.status === 404 || response.status === 410;
        throw error;
      }
      const declared = Number(response.headers.get("content-length"));
      if (Number.isFinite(declared) && declared > MAX_FEED_BYTES) throw new Error("Feed exceeds size limit");
      const body = await response.text();
      if (Buffer.byteLength(body, "utf8") > MAX_FEED_BYTES) throw new Error("Feed exceeds size limit");
      return body;
    } catch (error) {
      lastError = error;
      if (error.permanent || attempt === retries) break;
      await sleep(250 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

async function pool(tasks, concurrency) {
  const results = new Array(tasks.length);
  let index = 0;
  async function worker() {
    while (index < tasks.length) {
      const current = index++;
      results[current] = await tasks[current]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  return results;
}

export async function collectFeeds(sources, options = {}) {
  const cutoffMs = Date.now() - options.hours * 3600 * 1000;
  const health = {};
  const tasks = sources.map((source) => async () => {
    try {
      const xml = await fetchFeed(source.xmlUrl, options);
      const articles = parseFeed(xml, source, cutoffMs);
      health[source.name] = { ok: true, articles: articles.length };
      return articles;
    } catch (error) {
      health[source.name] = { ok: false, error: error.message, permanent: Boolean(error.permanent) };
      return [];
    }
  });
  const nested = await pool(tasks, options.concurrency);
  return { articles: dedupeArticles(nested.flat()).sort((a, b) => b.timestamp - a.timestamp), health };
}

function argValue(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

export async function main(argv = process.argv.slice(2)) {
  const hours = Number.parseInt(argValue(argv, "--hours", "24"), 10);
  const concurrency = Number.parseInt(argValue(argv, "--concurrency", "15"), 10);
  const timeoutMs = Number.parseInt(argValue(argv, "--timeout-ms", "15000"), 10);
  const retries = Number.parseInt(argValue(argv, "--retries", "2"), 10);
  const sourcesPath = resolve(argValue(argv, "--sources", resolve(scriptDir, "../references/sources.json")));
  const statePath = argValue(argv, "--state", undefined);
  if (!Number.isInteger(hours) || hours < 1 || hours > 720) throw new Error("--hours must be 1..720");
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 30) throw new Error("--concurrency must be 1..30");
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000) throw new Error("--timeout-ms must be 1000..60000");
  if (!Number.isInteger(retries) || retries < 0 || retries > 5) throw new Error("--retries must be 0..5");

  const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
  process.stderr.write(`[fetch-rss] Fetching ${sources.length} feeds (${hours}h, ${concurrency} concurrent)\n`);
  const result = await collectFeeds(sources, { hours, concurrency, timeoutMs, retries });
  const failures = Object.entries(result.health).filter(([, item]) => !item.ok);
  for (const [name, item] of failures) process.stderr.write(`[fetch-rss] failed ${name}: ${item.error}\n`);

  if (statePath) {
    const state = await readState(statePath);
    for (const source of sources) {
      const previous = state.sourceHealth[source.name] ?? { consecutiveFailures: 0 };
      const current = result.health[source.name];
      state.sourceHealth[source.name] = current.ok
        ? { consecutiveFailures: 0, lastSuccessAt: new Date().toISOString(), articles: current.articles }
        : { ...previous, consecutiveFailures: (previous.consecutiveFailures ?? 0) + 1, lastFailureAt: new Date().toISOString(), error: current.error, unhealthy: current.permanent || (previous.consecutiveFailures ?? 0) + 1 >= 3 };
    }
    await writeStateAtomic(statePath, state);
  }

  process.stderr.write(`[fetch-rss] Done: ${result.articles.length} unique articles; ${sources.length - failures.length} feeds ok; ${failures.length} failed\n`);
  process.stdout.write(JSON.stringify(result.articles, null, 2));
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`[fetch-rss] Fatal: ${error.message}\n`);
    process.exit(1);
  });
}
