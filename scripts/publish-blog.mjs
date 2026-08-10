#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { publishBlogPost } from "./lib/aiweb.mjs";

const args = process.argv.slice(2);
const index = args.indexOf("--payload");
if (index < 0 || !args[index + 1]) {
  console.error("Usage: publish-blog.mjs --payload <post.json>");
  process.exit(1);
}
try {
  const post = JSON.parse(await readFile(resolve(args[index + 1]), "utf8"));
  const result = await publishBlogPost(post);
  console.log(JSON.stringify({ ok: true, id: result.stored.id, slug: result.stored.slug, status: result.stored.status }));
} catch (error) {
  console.error(`[publish-blog] ${error.message}`);
  process.exit(1);
}

