import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredPlacementThresholdView,
  toTieredPlacementThresholdViews,
} from "./tiered-placement-threshold-view.js";
import { newTieredPlacementThreshold } from "./tiered-placement-threshold.js";

test("TieredPlacementThresholdView shows the status in capitals", () => {
  const item = newTieredPlacementThreshold("code-274", "name-177");
  const view = toTieredPlacementThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredPlacementThresholdViews([item, item]).length, 2, "views");
});
