import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckManifestView, toFraudCheckManifestViews } from "./fraud-check-manifest-view.js";
import { newFraudCheckManifest } from "./fraud-check-manifest.js";

test("FraudCheckManifestView shows the status in capitals", () => {
  const item = newFraudCheckManifest("code-610", "label-776");
  const view = toFraudCheckManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckManifestViews([item, item]).length, 2, "views");
});
