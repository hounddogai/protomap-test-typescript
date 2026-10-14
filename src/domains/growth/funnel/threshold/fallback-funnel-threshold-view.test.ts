import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackFunnelThresholdView, toFallbackFunnelThresholdViews } from "./fallback-funnel-threshold-view.js";
import { newFallbackFunnelThreshold } from "./fallback-funnel-threshold.js";

test("FallbackFunnelThresholdView shows the status in capitals", () => {
  const item = newFallbackFunnelThreshold("code-49", "title-788");
  const view = toFallbackFunnelThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackFunnelThresholdViews([item, item]).length, 2, "views");
});
