import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledInsightThresholdView,
  toScheduledInsightThresholdViews,
} from "./scheduled-insight-threshold-view.js";
import { newScheduledInsightThreshold } from "./scheduled-insight-threshold.js";

test("ScheduledInsightThresholdView shows the status in capitals", () => {
  const item = newScheduledInsightThreshold("code-145", "name-903");
  const view = toScheduledInsightThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledInsightThresholdViews([item, item]).length, 2, "views");
});
