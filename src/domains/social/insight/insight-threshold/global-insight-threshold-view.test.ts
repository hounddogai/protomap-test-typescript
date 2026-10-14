import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalInsightThresholdView, toGlobalInsightThresholdViews } from "./global-insight-threshold-view.js";
import { newGlobalInsightThreshold } from "./global-insight-threshold.js";

test("GlobalInsightThresholdView shows the status in capitals", () => {
  const item = newGlobalInsightThreshold("code-79", "title-115");
  const view = toGlobalInsightThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalInsightThresholdViews([item, item]).length, 2, "views");
});
