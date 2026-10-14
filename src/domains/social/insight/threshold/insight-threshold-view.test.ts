import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightThresholdView, toInsightThresholdViews } from "./insight-threshold-view.js";
import { newInsightThreshold } from "./insight-threshold.js";

test("InsightThresholdView shows the status in capitals", () => {
  const item = newInsightThreshold("code-201", "name-669");
  const view = toInsightThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightThresholdViews([item, item]).length, 2, "views");
});
