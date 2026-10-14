import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledWarmupThresholdView,
  toScheduledWarmupThresholdViews,
} from "./scheduled-warmup-threshold-view.js";
import { newScheduledWarmupThreshold } from "./scheduled-warmup-threshold.js";

test("ScheduledWarmupThresholdView shows the status in capitals", () => {
  const item = newScheduledWarmupThreshold("code-818", "title-901");
  const view = toScheduledWarmupThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledWarmupThresholdViews([item, item]).length, 2, "views");
});
