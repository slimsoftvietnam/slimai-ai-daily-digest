import { createHash } from "node:crypto";

export function versionedFeaturedSourceUrl(sourceUrl, bytes) {
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  return `${sourceUrl}${sourceUrl.includes("?") ? "&" : "?"}slimai_cover_sha256=${digest}`;
}
