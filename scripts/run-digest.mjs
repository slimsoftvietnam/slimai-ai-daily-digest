#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { collectFeeds } from "./fetch-rss.mjs";
import { publishBlogPost, uploadAsset } from "./lib/aiweb.mjs";
import { markSentUrls, readState, unseenArticles, writeStateAtomic } from "./lib/state-store.mjs";
import { canonicalizeUrl } from "./lib/url.mjs";
import { sendZaloDigest } from "./send-zalo.mjs";
import { validateDraft } from "./validate-draft.mjs";
import { verifyPublicBlog } from "./verify-blog.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));

function argValue(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

async function collectCandidates({ sourcesPath, statePath, hours, runDir }) {
  const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
  const result = await collectFeeds(sources, { hours, concurrency: 15, timeoutMs: 15000, retries: 2 });
  const state = await readState(statePath);
  const candidates = unseenArticles(result.articles, state);
  await mkdir(runDir, { recursive: true });
  await writeFile(resolve(runDir, "candidates.json"), `${JSON.stringify(candidates, null, 2)}\n`, "utf8");

  for (const source of sources) {
    const previous = state.sourceHealth[source.name] ?? { consecutiveFailures: 0 };
    const current = result.health[source.name];
    state.sourceHealth[source.name] = current.ok
      ? { consecutiveFailures: 0, lastSuccessAt: new Date().toISOString(), articles: current.articles }
      : { ...previous, consecutiveFailures: (previous.consecutiveFailures ?? 0) + 1, lastFailureAt: new Date().toISOString(), error: current.error, unhealthy: current.permanent || (previous.consecutiveFailures ?? 0) + 1 >= 3 };
  }
  await writeStateAtomic(statePath, state);
  return { candidates, health: result.health };
}

async function prepareAssets(manifest, manifestDir) {
  let content = manifest.post.content;
  let featuredImage = manifest.post.featured_image;
  const uploaded = [];
  for (const asset of manifest.assets ?? []) {
    if (!asset.id || !asset.file || !asset.sourceUrl) throw new Error("Each asset requires id, file, and sourceUrl");
    const upload = await uploadAsset(resolve(manifestDir, asset.file), asset.sourceUrl);
    content = content.replaceAll(`{{asset:${asset.id}}}`, upload.absoluteUrl);
    if (asset.featured) featuredImage = upload.localPath;
    uploaded.push({ id: asset.id, localPath: upload.localPath, absoluteUrl: upload.absoluteUrl });
  }
  if (/\{\{asset:[^}]+\}\}/.test(content)) throw new Error("Blog content still contains unresolved asset placeholders");
  return { post: { ...manifest.post, content, featured_image: featuredImage }, uploaded };
}

export async function runDigest(options) {
  const collection = await collectCandidates(options);
  if (options.collectOnly) return { ok: true, phase: "collect", candidates: collection.candidates.length, health: collection.health };

  const manifest = JSON.parse(await readFile(options.manifestPath, "utf8"));
  const validation = validateDraft(manifest);
  if (!validation.ok) throw new Error(`Draft validation failed: ${validation.errors.join("; ")}`);
  const state = await readState(options.statePath);
  const selected = validation.selectedUrls.filter((url) => !state.sentUrls.includes(url));
  if (selected.length === 0) return { ok: true, skipped: true, reason: "no_new_selected_urls", candidates: collection.candidates.length };

  const prepared = await prepareAssets(manifest, dirname(options.manifestPath));
  const api = await publishBlogPost(prepared.post);
  const publicUrl = canonicalizeUrl(manifest.publicUrl || `${process.env.SLIMAI_AIWEB_BASE_URL?.replace(/\/+$/, "")}/blog/${prepared.post.slug}`);
  if (!publicUrl) throw new Error("Could not derive a valid public blog URL");
  const publicVerification = await verifyPublicBlog(publicUrl, {
    title: prepared.post.title,
    requiredContent: manifest.requiredContent ?? [],
  });

  const zaloFile = resolve(options.runDir, "zalo-message.txt");
  await writeFile(zaloFile, manifest.zaloText, "utf8");
  const dryRun = await sendZaloDigest({ file: zaloFile, maxChars: options.zaloMaxChars, dryRun: true });
  const zalo = await sendZaloDigest({
    file: zaloFile,
    blogUrl: publicUrl,
    statePath: options.statePath,
    maxChars: options.zaloMaxChars,
    endpoint: process.env.SLIMAI_ZALO_BOT_ENDPOINT,
    apiKey: process.env.SLIMAI_ZALO_BOT_API_KEY,
    resumeAmbiguous: options.resumeAmbiguous,
  });

  const finalState = markSentUrls(await readState(options.statePath), selected);
  finalState.lastBlogUrl = publicUrl;
  await writeStateAtomic(options.statePath, finalState);
  return {
    ok: true,
    candidates: collection.candidates.length,
    selectedUrls: selected.length,
    blog: { id: api.stored.id, slug: api.stored.slug, url: publicUrl },
    ogImage: { ok: true, url: publicVerification.ogImage, status: publicVerification.imageStatus, type: publicVerification.imageType },
    assets: prepared.uploaded,
    zalo: { ...zalo, dryRunCharacters: dryRun.characters },
    sourceHealth: collection.health,
    warnings: validation.warnings,
  };
}

export async function main(argv = process.argv.slice(2)) {
  const manifestValue = argValue(argv, "--manifest");
  const collectOnly = argv.includes("--collect-only");
  if (!collectOnly && !manifestValue) throw new Error("Usage: run-digest.mjs --manifest <run.json> --state <state.json> [--run-dir dir] or --collect-only");
  const statePath = resolve(argValue(argv, "--state", resolve(process.cwd(), "work/slimai-ai-daily-digest-state.json")));
  const runDir = resolve(argValue(argv, "--run-dir", resolve(process.cwd(), "work/slimai-ai-daily-digest-run")));
  const result = await runDigest({
    manifestPath: manifestValue ? resolve(manifestValue) : undefined,
    sourcesPath: resolve(argValue(argv, "--sources", resolve(scriptDir, "../references/sources.json"))),
    statePath,
    runDir,
    hours: Number.parseInt(argValue(argv, "--hours", "24"), 10),
    zaloMaxChars: Number.parseInt(argValue(argv, "--zalo-max-chars", process.env.SLIMAI_ZALO_MAX_CHARS || "1800"), 10),
    collectOnly,
    resumeAmbiguous: argv.includes("--resume-ambiguous"),
  });
  console.log(JSON.stringify(result, null, 2));
  return result;
}

main().catch((error) => {
  console.error(`[run-digest] ${error.message}`);
  process.exit(1);
});

