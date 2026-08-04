#!/usr/bin/env node
/**
 * fetch-rss.mjs — Concurrent RSS/Atom feed fetcher & parser
 * Zero dependencies, runs on Node.js 18+
 * 
 * Usage: node fetch-rss.mjs [--hours 24] [--sources sources.json]
 * Output: JSON array of articles to stdout
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Config ---
const args = process.argv.slice(2);
const hoursArg = args.includes('--hours') ? parseInt(args[args.indexOf('--hours') + 1], 10) : 24;
const sourcesArg = args.includes('--sources') ? args[args.indexOf('--sources') + 1] : resolve(__dirname, '../references/sources.json');
const concurrency = args.includes('--concurrency') ? parseInt(args[args.indexOf('--concurrency') + 1], 10) : 15;
const timeoutMs = args.includes('--timeout-ms') ? parseInt(args[args.indexOf('--timeout-ms') + 1], 10) : 15000;
const maxFeedBytes = 5 * 1024 * 1024;

function exitWithUsageError(message) {
  process.stderr.write(`[fetch-rss] Fatal: ${message}\n`);
  process.exit(1);
}

if (!Number.isInteger(hoursArg) || hoursArg < 1 || hoursArg > 720) {
  exitWithUsageError('--hours must be an integer from 1 to 720');
}
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 30) {
  exitWithUsageError('--concurrency must be an integer from 1 to 30');
}
if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000) {
  exitWithUsageError('--timeout-ms must be an integer from 1000 to 60000');
}

const cutoff = Date.now() - hoursArg * 3600 * 1000;

// --- Load sources ---
const sources = JSON.parse(readFileSync(sourcesArg, 'utf-8'));

// --- XML helpers (zero-dependency) ---
function extractTag(xml, tag) {
  const patterns = [
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'),
    new RegExp(`<${tag}[^>]*/>`, 'i'),
  ];
  const m = xml.match(patterns[0]);
  return m ? m[1].trim() : '';
}

function extractAllBlocks(xml, tag) {
  const re = new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, 'gi');
  return xml.match(re) || [];
}

function extractLink(block, baseUrl) {
  // Atom: <link href="..." rel="alternate"/>
  const atomLink = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']alternate["']/i)
    || block.match(/<link[^>]+rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
    || block.match(/<link[^>]+href=["']([^"']+)["'][^>]*/i);
  if (atomLink) return resolveHttpUrl(atomLink[1], baseUrl);
  // RSS: <link>...</link>
  const rssLink = block.match(/<link>([^<]+)<\/link>/i);
  return rssLink ? resolveHttpUrl(rssLink[1].trim(), baseUrl) : '';
}

function resolveHttpUrl(value, baseUrl) {
  try {
    const url = new URL(value, baseUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(parseInt(decimal, 10)))
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function parseDate(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

// --- Parse a single feed ---
function parseFeed(xml, source) {
  const articles = [];
  
  // Try Atom entries first
  let entries = extractAllBlocks(xml, 'entry');
  let format = 'atom';
  
  // Fallback to RSS items
  if (entries.length === 0) {
    entries = extractAllBlocks(xml, 'item');
    format = 'rss';
  }
  
  for (const entry of entries) {
    const title = decodeEntities(extractTag(entry, 'title'));
    const link = extractLink(entry, source.xmlUrl);
    const pubDate = extractTag(entry, format === 'atom' ? 'published' : 'pubDate')
      || extractTag(entry, 'updated')
      || extractTag(entry, 'dc:date');
    const summary = decodeEntities(
      extractTag(entry, 'summary') || extractTag(entry, 'description') || ''
    ).slice(0, 500);
    
    const timestamp = parseDate(pubDate);
    
    if (title && link && timestamp >= cutoff) {
      articles.push({
        title,
        link,
        summary,
        timestamp,
        date: new Date(timestamp).toISOString(),
        source: source.name,
        sourceUrl: source.htmlUrl,
      });
    }
  }
  
  return articles;
}

// --- Concurrent fetcher with pool ---
async function fetchWithTimeout(url, ms) {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error(`Unsupported URL protocol: ${parsedUrl.protocol}`);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AIDailyDigest-Codex/1.0 (+https://github.com/HarrisHan/ai-daily-digest)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentLength = Number(res.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > maxFeedBytes) {
      throw new Error(`Feed exceeds ${maxFeedBytes} bytes`);
    }
    const body = await res.text();
    if (Buffer.byteLength(body, 'utf8') > maxFeedBytes) {
      throw new Error(`Feed exceeds ${maxFeedBytes} bytes`);
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function pool(tasks, concurrencyLimit) {
  const results = [];
  let index = 0;
  
  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }
  
  await Promise.all(Array.from({ length: Math.min(concurrencyLimit, tasks.length) }, () => worker()));
  return results;
}

// --- Main ---
async function main() {
  const stats = { ok: 0, failed: 0, total: sources.length };
  const allArticles = [];
  
  process.stderr.write(`[fetch-rss] Fetching ${sources.length} feeds (${hoursArg}h window, ${concurrency} concurrent)...\n`);
  
  const tasks = sources.map((source, i) => async () => {
    try {
      const xml = await fetchWithTimeout(source.xmlUrl, timeoutMs);
      const articles = parseFeed(xml, source);
      allArticles.push(...articles);
      stats.ok++;
    } catch (err) {
      stats.failed++;
      process.stderr.write(`[fetch-rss] ✗ ${source.name}: ${err.message}\n`);
    }
    
    if ((stats.ok + stats.failed) % 20 === 0) {
      process.stderr.write(`[fetch-rss] Progress: ${stats.ok + stats.failed}/${stats.total} (${stats.ok} ok, ${stats.failed} failed)\n`);
    }
  });
  
  await pool(tasks, concurrency);
  
  // Sort by timestamp descending
  allArticles.sort((a, b) => b.timestamp - a.timestamp);
  
  process.stderr.write(`[fetch-rss] Done: ${allArticles.length} articles from ${stats.ok} feeds (${stats.failed} failed)\n`);
  
  // Output JSON to stdout
  process.stdout.write(JSON.stringify(allArticles, null, 2));
}

main().catch(err => {
  process.stderr.write(`[fetch-rss] Fatal: ${err.message}\n`);
  process.exit(1);
});
