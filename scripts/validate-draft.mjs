#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { canonicalizeUrl } from "./lib/url.mjs";

export function validateDraft(manifest) {
  const errors = [];
  const warnings = [];
  const post = manifest?.post;
  if (!post || typeof post !== "object") errors.push("manifest.post is required");
  for (const field of ["slug", "title", "content", "seo_description"]) {
    if (typeof post?.[field] !== "string" || post[field].trim() === "") errors.push(`post.${field} is required`);
  }
  if (post?.title && !/^.+\s\|\sBản tin AI ngày \d{2}\/\d{2}$/.test(post.title.trim())) {
    errors.push("post.title must use: {primary story} | Bản tin AI ngày DD/MM");
  }
  if (post?.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) errors.push("post.slug must be lowercase ASCII kebab-case");
  if (/\b\d{1,3}\/100\b|SlimAI đánh giá|Major AI Update|Verified AI Case Study/i.test(post?.content ?? "")) errors.push("public content exposes internal scoring or category labels");

  const content = post?.content ?? "";
  const expectedOrder = ["Góc nhìn chiến lược", "Case study", "Cập nhật chính thức"];
  const positions = expectedOrder.map((heading) => content.toLocaleLowerCase("vi").indexOf(heading.toLocaleLowerCase("vi")));
  const present = positions.filter((position) => position >= 0);
  if (present.some((position, index) => index > 0 && position < present[index - 1])) errors.push("section order must be strategic → case study → official updates");
  if (!/<h2[^>]*>\s*1\./i.test(content)) warnings.push("major H2 sections do not appear to be numbered from 1");

  const selectedUrls = (manifest.selectedUrls ?? []).map(canonicalizeUrl).filter(Boolean);
  if (selectedUrls.length !== (manifest.selectedUrls ?? []).length) errors.push("selectedUrls contains an invalid URL");
  if (new Set(selectedUrls).size !== selectedUrls.length) errors.push("selectedUrls contains canonical duplicates");
  if (typeof manifest.zaloText !== "string" || manifest.zaloText.trim() === "") errors.push("manifest.zaloText is required");
  if (/\*\*|<\/?[a-z][^>]*>/i.test(manifest.zaloText ?? "")) errors.push("Zalo text must not contain Markdown bold or HTML");
  if (manifest.zaloText && !manifest.zaloText.trim().endsWith(manifest.publicUrl ?? "")) errors.push("Zalo text must end with the public blog URL");
  return { ok: errors.length === 0, errors, warnings, selectedUrls };
}

export async function main(argv = process.argv.slice(2)) {
  const index = argv.indexOf("--manifest");
  if (index < 0 || !argv[index + 1]) throw new Error("Usage: validate-draft.mjs --manifest <run.json>");
  const manifest = JSON.parse(await readFile(resolve(argv[index + 1]), "utf8"));
  const result = validateDraft(manifest);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(`[validate-draft] ${error.message}`); process.exit(1); });
}
