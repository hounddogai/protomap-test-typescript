import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientModelManifestView, toLenientModelManifestViews } from "./lenient-model-manifest-view.js";
import { newLenientModelManifest } from "./lenient-model-manifest.js";

test("LenientModelManifestView shows the status in capitals", () => {
  const item = newLenientModelManifest("code-300", "label-505");
  const view = toLenientModelManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientModelManifestViews([item, item]).length, 2, "views");
});
