import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredDeflectionManifestView,
  toTieredDeflectionManifestViews,
} from "./tiered-deflection-manifest-view.js";
import { newTieredDeflectionManifest } from "./tiered-deflection-manifest.js";

test("TieredDeflectionManifestView shows the status in capitals", () => {
  const item = newTieredDeflectionManifest("code-595", "title-706");
  const view = toTieredDeflectionManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredDeflectionManifestViews([item, item]).length, 2, "views");
});
