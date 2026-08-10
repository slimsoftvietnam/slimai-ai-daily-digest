import { mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { canonicalizeUrl } from "./url.mjs";

export const STATE_VERSION = 2;

export function normalizeState(raw = {}) {
  const sentUrls = [...new Set((raw.sentUrls ?? []).map(canonicalizeUrl).filter(Boolean))];
  const zaloSentBlogUrls = [...new Set((raw.zaloSentBlogUrls ?? []).map(canonicalizeUrl).filter(Boolean))];
  return {
    ...raw,
    version: STATE_VERSION,
    sentUrls,
    zaloSentBlogUrls,
    zaloDeliveries: raw.zaloDeliveries && typeof raw.zaloDeliveries === "object" ? raw.zaloDeliveries : {},
    sourceHealth: raw.sourceHealth && typeof raw.sourceHealth === "object" ? raw.sourceHealth : {},
  };
}

export async function readState(path) {
  try {
    return normalizeState(JSON.parse(await readFile(path, "utf8")));
  } catch (error) {
    if (error?.code === "ENOENT") return normalizeState();
    throw new Error(`Invalid state file ${path}: ${error.message}`);
  }
}

export async function writeStateAtomic(path, state) {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temp, `${JSON.stringify(normalizeState(state), null, 2)}\n`, "utf8");
  await rename(temp, path);
}

export async function withStateLock(path, callback, options = {}) {
  const lockPath = `${path}.lock`;
  await mkdir(dirname(path), { recursive: true });
  let handle;
  try {
    handle = await open(lockPath, "wx");
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error(`State is locked by another run: ${lockPath}`);
    }
    throw error;
  }
  try {
    const state = await readState(path);
    const result = await callback(state);
    if (result?.state) await writeStateAtomic(path, result.state);
    return result?.value;
  } finally {
    await handle?.close();
    await rm(lockPath, { force: true });
  }
}

export function unseenArticles(articles, state) {
  const sent = new Set(normalizeState(state).sentUrls);
  const seen = new Set();
  const output = [];
  for (const article of Array.isArray(articles) ? articles : []) {
    const url = canonicalizeUrl(article?.link ?? article?.url);
    if (!url || sent.has(url) || seen.has(url)) continue;
    seen.add(url);
    output.push({ ...article, link: url });
  }
  return output;
}

export function markSentUrls(state, urls) {
  const next = normalizeState(state);
  next.sentUrls = [...new Set([...next.sentUrls, ...(urls ?? []).map(canonicalizeUrl).filter(Boolean)])];
  next.lastRunAt = new Date().toISOString();
  return next;
}

