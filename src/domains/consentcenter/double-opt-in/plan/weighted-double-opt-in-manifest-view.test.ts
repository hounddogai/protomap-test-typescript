import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedDoubleOptInManifestView,
  toWeightedDoubleOptInManifestViews,
} from "./weighted-double-opt-in-manifest-view.js";
import { newWeightedDoubleOptInManifest } from "./weighted-double-opt-in-manifest.js";

test("WeightedDoubleOptInManifestView shows the status in capitals", () => {
  const item = newWeightedDoubleOptInManifest("code-386", "label-502");
  const view = toWeightedDoubleOptInManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedDoubleOptInManifestViews([item, item]).length, 2, "views");
});
