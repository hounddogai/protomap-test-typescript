import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightEstimateView, toInsightEstimateViews } from "./insight-estimate-view.js";
import { newInsightEstimate } from "./insight-estimate.js";

test("InsightEstimateView shows the status in capitals", () => {
  const item = newInsightEstimate("code-656", "label-450");
  const view = toInsightEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightEstimateViews([item, item]).length, 2, "views");
});
