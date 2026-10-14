import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementEstimateView, toPlacementEstimateViews } from "./placement-estimate-view.js";
import { newPlacementEstimate } from "./placement-estimate.js";

test("PlacementEstimateView shows the status in capitals", () => {
  const item = newPlacementEstimate("code-702", "label-955");
  const view = toPlacementEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementEstimateViews([item, item]).length, 2, "views");
});
