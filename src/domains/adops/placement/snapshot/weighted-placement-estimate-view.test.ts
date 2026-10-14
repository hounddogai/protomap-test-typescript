import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedPlacementEstimateView,
  toWeightedPlacementEstimateViews,
} from "./weighted-placement-estimate-view.js";
import { newWeightedPlacementEstimate } from "./weighted-placement-estimate.js";

test("WeightedPlacementEstimateView shows the status in capitals", () => {
  const item = newWeightedPlacementEstimate("code-633", "title-685");
  const view = toWeightedPlacementEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedPlacementEstimateViews([item, item]).length, 2, "views");
});
