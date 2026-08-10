#!/usr/bin/env node
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

function metaContent(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const forward = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i");
  const reverse = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i");
  return (html.match(forward) || html.match(reverse))?.[1] ?? "";
}

export async function verifyPublicBlog(url, options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(url, { redirect: "follow" });
  const html = await response.text();
  if (!response.ok) throw new Error(`Public blog returned HTTP ${response.status}`);
  if (options.title && !html.includes(options.title)) throw new Error("Public page is missing the expected title");
  for (const marker of options.requiredContent ?? []) {
    if (!html.includes(marker)) throw new Error(`Public page is missing required content: ${marker}`);
  }
  const ogTitle = metaContent(html, "og:title");
  const ogDescription = metaContent(html, "og:description");
  const rawOgImage = metaContent(html, "og:image");
  if (!ogTitle || !ogDescription || !rawOgImage) throw new Error("Public page is missing required Open Graph metadata");
  const ogImage = new URL(rawOgImage, url).href;
  if (!/^https?:\/\//i.test(ogImage)) throw new Error("og:image is not an absolute HTTP(S) URL");
  let imageResponse = await fetchImpl(ogImage, { method: "HEAD", redirect: "follow" });
  if (imageResponse.status === 405) imageResponse = await fetchImpl(ogImage, { method: "GET", redirect: "follow" });
  const imageType = imageResponse.headers.get("content-type") ?? "";
  if (!imageResponse.ok || !imageType.toLowerCase().startsWith("image/")) throw new Error(`og:image failed verification: HTTP ${imageResponse.status}, ${imageType || "unknown type"}`);
  return { ok: true, url: response.url || url, ogTitle, ogDescription, ogImage, imageStatus: imageResponse.status, imageType, bytes: Buffer.byteLength(html) };
}

function argValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

export async function main(argv = process.argv.slice(2)) {
  const url = argValue(argv, "--url");
  if (!url) throw new Error("Usage: verify-blog.mjs --url <public-url> [--title <title>] [--contains <text>]");
  const requiredContent = [];
  for (let index = 0; index < argv.length; index += 1) if (argv[index] === "--contains") requiredContent.push(argv[index + 1]);
  const result = await verifyPublicBlog(url, { title: argValue(argv, "--title"), requiredContent });
  console.log(JSON.stringify(result));
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(`[verify-blog] ${error.message}`); process.exit(1); });
}

