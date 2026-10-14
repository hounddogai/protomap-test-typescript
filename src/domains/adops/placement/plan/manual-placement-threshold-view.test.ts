import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toManualPlacementThresholdView,
  toManualPlacementThresholdViews,
} from "./manual-placement-threshold-view.js";
import { newManualPlacementThreshold } from "./manual-placement-threshold.js";

test("ManualPlacementThresholdView shows the status in capitals", () => {
  const item = newManualPlacementThreshold("code-771", "label-195");
  const view = toManualPlacementThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualPlacementThresholdViews([item, item]).length, 2, "views");
});
