import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionManifestView, toDeflectionManifestViews } from "./deflection-manifest-view.js";
import { newDeflectionManifest } from "./deflection-manifest.js";

test("DeflectionManifestView shows the status in capitals", () => {
  const item = newDeflectionManifest("code-907", "name-43");
  const view = toDeflectionManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionManifestViews([item, item]).length, 2, "views");
});
