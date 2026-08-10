import assert from "node:assert/strict";
import test from "node:test";
import { publishBlogPost } from "../scripts/lib/aiweb.mjs";
import { verifyPublicBlog } from "../scripts/verify-blog.mjs";

test("AIWeb blog payload and API verification use the expected actions", async () => {
  const calls = [];
  const fetchImpl = async (url, request) => {
    calls.push({ url, body: JSON.parse(request.body) });
    if (url.includes("action=upsert_blog_post")) return new Response(JSON.stringify({ ok: true, post: { id: 7 } }), { status: 200 });
    return new Response(JSON.stringify({ ok: true, post: { id: 7, slug: "tin-moi", title: "Tin mới", status: "published", content: "<p>Nội dung</p>" } }), { status: 200 });
  };
  const result = await publishBlogPost({ slug: "tin-moi", title: "Tin mới", content: "<p>Nội dung</p>", seo_description: "Mô tả" }, { baseUrl: "https://ai.example", apiKey: "key", fetchImpl });
  assert.equal(result.stored.id, 7);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].body.source_domain, "slimai-ai-daily-digest");
  assert.equal(calls[0].body.status, "published");
});

test("public verification checks Open Graph image status and type", async () => {
  const html = `<html><head><meta property="og:title" content="Tin mới"><meta property="og:description" content="Mô tả"><meta property="og:image" content="/uploads/cover.jpg"></head><body><h1>Tin mới</h1><p>Điểm cần kiểm tra</p></body></html>`;
  const fetchImpl = async (url, request = {}) => {
    if (String(url).endsWith("cover.jpg")) return new Response("", { status: 200, headers: { "content-type": "image/jpeg" } });
    return new Response(html, { status: 200, headers: { "content-type": "text/html" } });
  };
  const result = await verifyPublicBlog("https://ai.example/blog/tin-moi", { title: "Tin mới", requiredContent: ["Điểm cần kiểm tra"], fetchImpl });
  assert.equal(result.ogImage, "https://ai.example/uploads/cover.jpg");
  assert.equal(result.imageType, "image/jpeg");
});

