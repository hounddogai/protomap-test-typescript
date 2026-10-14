import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredCreativeManifestView, toTieredCreativeManifestViews } from "./tiered-creative-manifest-view.js";
import { newTieredCreativeManifest } from "./tiered-creative-manifest.js";

test("TieredCreativeManifestView shows the status in capitals", () => {
  const item = newTieredCreativeManifest("code-783", "title-336");
  const view = toTieredCreativeManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredCreativeManifestViews([item, item]).length, 2, "views");
});
