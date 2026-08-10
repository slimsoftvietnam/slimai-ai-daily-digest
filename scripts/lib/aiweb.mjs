import { readFile } from "node:fs/promises";
import { extname } from "node:path";

function cleanBase(baseUrl) {
  if (!baseUrl) throw new Error("Missing SLIMAI_AIWEB_BASE_URL");
  return baseUrl.replace(/\/+$/, "");
}

export async function aiwebPost(action, payload, options = {}) {
  const baseUrl = cleanBase(options.baseUrl ?? process.env.SLIMAI_AIWEB_BASE_URL);
  const apiKey = options.apiKey ?? process.env.SLIMAI_AIWEB_API_KEY;
  if (!apiKey) throw new Error("Missing SLIMAI_AIWEB_API_KEY");
  const response = await (options.fetchImpl ?? fetch)(`${baseUrl}/api/agent.php?action=${encodeURIComponent(action)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = null; }
  if (!response.ok || data?.ok === false || data === null) {
    throw new Error(`AIWeb ${action} failed: HTTP ${response.status}`);
  }
  return data;
}

function mimeFor(path) {
  const extension = extname(path).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  return "image/jpeg";
}

export async function uploadAsset(path, sourceUrl, options = {}) {
  const bytes = await readFile(path);
  const filename = path.split(/[\\/]/).pop();
  const data = await aiwebPost("upload_asset_base64", {
    source_domain: "slimai-ai-daily-digest",
    source_url: sourceUrl,
    filename,
    mime_type: mimeFor(path),
    data: bytes.toString("base64"),
  }, options);
  const localPath = data.local_path ?? data.asset?.local_path ?? data.result?.local_path;
  if (!localPath) throw new Error("AIWeb upload returned no local_path");
  const baseUrl = cleanBase(options.baseUrl ?? process.env.SLIMAI_AIWEB_BASE_URL);
  const absoluteUrl = /^https?:\/\//i.test(localPath) ? localPath : `${baseUrl}/uploads/${String(localPath).replace(/^\/?uploads\//, "").replace(/^\//, "")}`;
  return { data, localPath, absoluteUrl };
}

export async function publishBlogPost(post, options = {}) {
  const required = ["slug", "title", "content", "seo_description"];
  for (const field of required) if (typeof post?.[field] !== "string" || post[field].trim() === "") throw new Error(`Blog post requires ${field}`);
  const payload = {
    source_domain: "slimai-ai-daily-digest",
    source_key: post.source_key ?? post.slug,
    status: "published",
    language: "vi",
    rewrite_assets: false,
    ...post,
  };
  const published = await aiwebPost("upsert_blog_post", payload, options);
  const verification = await aiwebPost("get_blog_post", { slug: post.slug, include_content: true }, options);
  const stored = verification.post ?? verification.result?.post;
  if (!stored || stored.status !== "published" || stored.slug !== post.slug || stored.title !== post.title) {
    throw new Error("AIWeb API verification did not return the expected published post");
  }
  return { published, stored };
}

