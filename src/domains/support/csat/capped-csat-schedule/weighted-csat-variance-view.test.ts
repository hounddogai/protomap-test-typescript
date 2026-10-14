import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedCsatVarianceView, toWeightedCsatVarianceViews } from "./weighted-csat-variance-view.js";
import { newWeightedCsatVariance } from "./weighted-csat-variance.js";

test("WeightedCsatVarianceView shows the status in capitals", () => {
  const item = newWeightedCsatVariance("code-451", "name-899");
  const view = toWeightedCsatVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedCsatVarianceViews([item, item]).length, 2, "views");
});
