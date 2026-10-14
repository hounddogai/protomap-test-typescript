import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightManifestView, toInsightManifestViews } from "./insight-manifest-view.js";
import { newInsightManifest } from "./insight-manifest.js";

test("InsightManifestView shows the status in capitals", () => {
  const item = newInsightManifest("code-195", "name-524");
  const view = toInsightManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightManifestViews([item, item]).length, 2, "views");
});
