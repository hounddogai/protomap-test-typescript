import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredSuppressionManifestView,
  toTieredSuppressionManifestViews,
} from "./tiered-suppression-manifest-view.js";
import { newTieredSuppressionManifest } from "./tiered-suppression-manifest.js";

test("TieredSuppressionManifestView shows the status in capitals", () => {
  const item = newTieredSuppressionManifest("code-629", "title-428");
  const view = toTieredSuppressionManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredSuppressionManifestViews([item, item]).length, 2, "views");
});
