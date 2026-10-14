import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementManifestView, toPlacementManifestViews } from "./placement-manifest-view.js";
import { newPlacementManifest } from "./placement-manifest.js";

test("PlacementManifestView shows the status in capitals", () => {
  const item = newPlacementManifest("code-117", "title-714");
  const view = toPlacementManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementManifestViews([item, item]).length, 2, "views");
});
