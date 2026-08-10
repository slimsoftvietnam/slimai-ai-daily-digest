#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import process from "node:process";
import { markSentUrls, readState, unseenArticles, writeStateAtomic } from "./lib/state-store.mjs";

function valueAfter(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const statePath = valueAfter(args, "--state");
  if (!command || !statePath) {
    throw new Error("Usage: state.mjs <init|filter|mark> --state <file> [--input <json>] [--urls <json>]");
  }
  if (command === "init") {
    const state = await readState(statePath);
    await writeStateAtomic(statePath, state);
    console.log(JSON.stringify({ ok: true, sentUrls: state.sentUrls.length }));
    return;
  }
  if (command === "filter") {
    const input = valueAfter(args, "--input");
    if (!input) throw new Error("filter requires --input <articles.json>");
    const articles = JSON.parse(await readFile(input, "utf8"));
    process.stdout.write(JSON.stringify(unseenArticles(articles, await readState(statePath)), null, 2));
    return;
  }
  if (command === "mark") {
    const urlsFile = valueAfter(args, "--urls");
    if (!urlsFile) throw new Error("mark requires --urls <urls.json>");
    const urls = JSON.parse(await readFile(urlsFile, "utf8"));
    const next = markSentUrls(await readState(statePath), urls);
    await writeStateAtomic(statePath, next);
    console.log(JSON.stringify({ ok: true, sentUrls: next.sentUrls.length }));
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`[state] ${error.message}`);
  process.exit(1);
});

