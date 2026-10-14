import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionEstimateView, toSuppressionEstimateViews } from "./suppression-estimate-view.js";
import { newSuppressionEstimate } from "./suppression-estimate.js";

test("SuppressionEstimateView shows the status in capitals", () => {
  const item = newSuppressionEstimate("code-256", "name-750");
  const view = toSuppressionEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionEstimateViews([item, item]).length, 2, "views");
});
