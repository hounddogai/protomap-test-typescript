import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyBadgeManifestView, toLegacyBadgeManifestViews } from "./legacy-badge-manifest-view.js";
import { newLegacyBadgeManifest } from "./legacy-badge-manifest.js";

test("LegacyBadgeManifestView shows the status in capitals", () => {
  const item = newLegacyBadgeManifest("code-117", "title-224");
  const view = toLegacyBadgeManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyBadgeManifestViews([item, item]).length, 2, "views");
});
