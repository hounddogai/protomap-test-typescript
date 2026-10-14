import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalSuppressionManifestView,
  toRegionalSuppressionManifestViews,
} from "./regional-suppression-manifest-view.js";
import { newRegionalSuppressionManifest } from "./regional-suppression-manifest.js";

test("RegionalSuppressionManifestView shows the status in capitals", () => {
  const item = newRegionalSuppressionManifest("code-166", "label-996");
  const view = toRegionalSuppressionManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalSuppressionManifestViews([item, item]).length, 2, "views");
});
