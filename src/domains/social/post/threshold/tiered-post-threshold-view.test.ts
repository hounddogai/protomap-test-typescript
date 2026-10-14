import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredPostThresholdView, toTieredPostThresholdViews } from "./tiered-post-threshold-view.js";
import { newTieredPostThreshold } from "./tiered-post-threshold.js";

test("TieredPostThresholdView shows the status in capitals", () => {
  const item = newTieredPostThreshold("code-594", "title-621");
  const view = toTieredPostThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredPostThresholdViews([item, item]).length, 2, "views");
});
