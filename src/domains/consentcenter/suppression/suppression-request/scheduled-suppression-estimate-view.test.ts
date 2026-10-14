import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledSuppressionEstimateView,
  toScheduledSuppressionEstimateViews,
} from "./scheduled-suppression-estimate-view.js";
import { newScheduledSuppressionEstimate } from "./scheduled-suppression-estimate.js";

test("ScheduledSuppressionEstimateView shows the status in capitals", () => {
  const item = newScheduledSuppressionEstimate("code-360", "name-235");
  const view = toScheduledSuppressionEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledSuppressionEstimateViews([item, item]).length, 2, "views");
});
