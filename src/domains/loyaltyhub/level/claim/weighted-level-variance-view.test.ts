import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedLevelVarianceView, toWeightedLevelVarianceViews } from "./weighted-level-variance-view.js";
import { newWeightedLevelVariance } from "./weighted-level-variance.js";

test("WeightedLevelVarianceView shows the status in capitals", () => {
  const item = newWeightedLevelVariance("code-170", "label-517");
  const view = toWeightedLevelVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedLevelVarianceViews([item, item]).length, 2, "views");
});
