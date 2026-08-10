import assert from "node:assert/strict";
import test from "node:test";
import { validateDraft } from "../scripts/validate-draft.mjs";

function manifest(title) {
  return {
    publicUrl: "https://ai.slim.vn/blog/github-models-ngung-hoat-dong",
    post: {
      slug: "github-models-ngung-hoat-dong",
      title,
      content: "<h2>1. Tóm tắt nhanh</h2><h2>2. Góc nhìn chiến lược</h2><h2>3. Case study</h2><h2>4. Cập nhật chính thức</h2>",
      seo_description: "Tóm tắt thay đổi mới nhất của GitHub Models."
    },
    selectedUrls: ["https://github.blog/example"],
    zaloText: "Bản tin\nhttps://ai.slim.vn/blog/github-models-ngung-hoat-dong"
  };
}

test("accepts the primary-story-first blog title", () => {
  const result = validateDraft(manifest("GitHub Models ngừng hoạt động | Bản tin AI ngày 10/08"));
  assert.equal(result.ok, true);
});

test("rejects the former SlimAI-first blog title", () => {
  const result = validateDraft(manifest("Bản tin SlimAI ngày 10/08: GitHub Models ngừng hoạt động"));
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /post\.title must use/);
});
