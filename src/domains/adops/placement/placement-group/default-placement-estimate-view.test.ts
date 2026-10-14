import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultPlacementEstimateView,
  toDefaultPlacementEstimateViews,
} from "./default-placement-estimate-view.js";
import { newDefaultPlacementEstimate } from "./default-placement-estimate.js";

test("DefaultPlacementEstimateView shows the status in capitals", () => {
  const item = newDefaultPlacementEstimate("code-917", "label-139");
  const view = toDefaultPlacementEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultPlacementEstimateViews([item, item]).length, 2, "views");
});
