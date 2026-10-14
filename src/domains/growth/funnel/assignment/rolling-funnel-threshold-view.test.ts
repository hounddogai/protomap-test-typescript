import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingFunnelThresholdView, toRollingFunnelThresholdViews } from "./rolling-funnel-threshold-view.js";
import { newRollingFunnelThreshold } from "./rolling-funnel-threshold.js";

test("RollingFunnelThresholdView shows the status in capitals", () => {
  const item = newRollingFunnelThreshold("code-852", "title-941");
  const view = toRollingFunnelThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingFunnelThresholdViews([item, item]).length, 2, "views");
});
