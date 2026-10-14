import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelManifestView, toModelManifestViews } from "./model-manifest-view.js";
import { newModelManifest } from "./model-manifest.js";

test("ModelManifestView shows the status in capitals", () => {
  const item = newModelManifest("code-622", "label-555");
  const view = toModelManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelManifestViews([item, item]).length, 2, "views");
});
