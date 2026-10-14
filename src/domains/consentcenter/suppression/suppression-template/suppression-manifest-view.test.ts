import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionManifestView, toSuppressionManifestViews } from "./suppression-manifest-view.js";
import { newSuppressionManifest } from "./suppression-manifest.js";

test("SuppressionManifestView shows the status in capitals", () => {
  const item = newSuppressionManifest("code-463", "title-951");
  const view = toSuppressionManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionManifestViews([item, item]).length, 2, "views");
});
