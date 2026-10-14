import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultSuppressionEstimateView,
  toDefaultSuppressionEstimateViews,
} from "./default-suppression-estimate-view.js";
import { newDefaultSuppressionEstimate } from "./default-suppression-estimate.js";

test("DefaultSuppressionEstimateView shows the status in capitals", () => {
  const item = newDefaultSuppressionEstimate("code-965", "title-793");
  const view = toDefaultSuppressionEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultSuppressionEstimateViews([item, item]).length, 2, "views");
});
