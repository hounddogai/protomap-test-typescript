import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLegacyDeflectionManifestView,
  toLegacyDeflectionManifestViews,
} from "./legacy-deflection-manifest-view.js";
import { newLegacyDeflectionManifest } from "./legacy-deflection-manifest.js";

test("LegacyDeflectionManifestView shows the status in capitals", () => {
  const item = newLegacyDeflectionManifest("code-77", "label-378");
  const view = toLegacyDeflectionManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyDeflectionManifestViews([item, item]).length, 2, "views");
});
