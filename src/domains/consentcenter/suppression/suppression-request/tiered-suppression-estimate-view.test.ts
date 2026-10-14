import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredSuppressionEstimateView,
  toTieredSuppressionEstimateViews,
} from "./tiered-suppression-estimate-view.js";
import { newTieredSuppressionEstimate } from "./tiered-suppression-estimate.js";

test("TieredSuppressionEstimateView shows the status in capitals", () => {
  const item = newTieredSuppressionEstimate("code-267", "name-36");
  const view = toTieredSuppressionEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredSuppressionEstimateViews([item, item]).length, 2, "views");
});
