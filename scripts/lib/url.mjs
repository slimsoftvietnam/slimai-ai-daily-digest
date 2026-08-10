const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "vero_conv",
  "vero_id",
]);

function isTrackingParam(name) {
  const lower = name.toLowerCase();
  return TRACKING_PARAMS.has(lower) || lower.startsWith("utm_");
}

export function canonicalizeUrl(input) {
  if (typeof input !== "string" || input.trim() === "") return "";
  let url;
  try {
    url = new URL(input.trim());
  } catch {
    return "";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "";

  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  const fragment = url.hash.slice(1).toLowerCase();
  if (["atom-everything", "comments", "respond"].includes(fragment) || fragment.startsWith("utm_")) {
    url.hash = "";
  }
  if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) {
    url.port = "";
  }

  const kept = [];
  for (const [name, value] of url.searchParams.entries()) {
    if (!isTrackingParam(name)) kept.push([name, value]);
  }
  kept.sort(([aName, aValue], [bName, bValue]) =>
    aName.localeCompare(bName) || aValue.localeCompare(bValue),
  );
  url.search = "";
  for (const [name, value] of kept) url.searchParams.append(name, value);

  url.pathname = url.pathname.replace(/\/{2,}/g, "/");
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.href;
}

export function normalizeTitle(input) {
  return String(input ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function dedupeArticles(articles) {
  const seenUrls = new Set();
  const seenTitles = new Set();
  const output = [];
  for (const article of Array.isArray(articles) ? articles : []) {
    const link = canonicalizeUrl(article?.link ?? article?.url);
    const titleKey = normalizeTitle(article?.title);
    if (!link || !titleKey || seenUrls.has(link) || seenTitles.has(titleKey)) continue;
    seenUrls.add(link);
    seenTitles.add(titleKey);
    output.push({ ...article, link });
  }
  return output;
}
