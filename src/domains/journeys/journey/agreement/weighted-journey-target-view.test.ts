import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedJourneyTargetView, toWeightedJourneyTargetViews } from "./weighted-journey-target-view.js";
import { newWeightedJourneyTarget } from "./weighted-journey-target.js";

test("WeightedJourneyTargetView shows the status in capitals", () => {
  const item = newWeightedJourneyTarget("code-784", "label-401");
  const view = toWeightedJourneyTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedJourneyTargetViews([item, item]).length, 2, "views");
});
