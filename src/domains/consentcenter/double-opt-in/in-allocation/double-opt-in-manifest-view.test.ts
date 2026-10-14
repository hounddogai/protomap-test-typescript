import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInManifestView, toDoubleOptInManifestViews } from "./double-opt-in-manifest-view.js";
import { newDoubleOptInManifest } from "./double-opt-in-manifest.js";

test("DoubleOptInManifestView shows the status in capitals", () => {
  const item = newDoubleOptInManifest("code-847", "name-885");
  const view = toDoubleOptInManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInManifestViews([item, item]).length, 2, "views");
});
