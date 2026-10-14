import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledFunnelThresholdView,
  toScheduledFunnelThresholdViews,
} from "./scheduled-funnel-threshold-view.js";
import { newScheduledFunnelThreshold } from "./scheduled-funnel-threshold.js";

test("ScheduledFunnelThresholdView shows the status in capitals", () => {
  const item = newScheduledFunnelThreshold("code-463", "title-477");
  const view = toScheduledFunnelThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledFunnelThresholdViews([item, item]).length, 2, "views");
});
