import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedFunnelThresholdView, toBatchedFunnelThresholdViews } from "./batched-funnel-threshold-view.js";
import { newBatchedFunnelThreshold } from "./batched-funnel-threshold.js";

test("BatchedFunnelThresholdView shows the status in capitals", () => {
  const item = newBatchedFunnelThreshold("code-104", "label-428");
  const view = toBatchedFunnelThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedFunnelThresholdViews([item, item]).length, 2, "views");
});
