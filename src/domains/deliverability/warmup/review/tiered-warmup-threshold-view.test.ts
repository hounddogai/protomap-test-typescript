import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredWarmupThresholdView, toTieredWarmupThresholdViews } from "./tiered-warmup-threshold-view.js";
import { newTieredWarmupThreshold } from "./tiered-warmup-threshold.js";

test("TieredWarmupThresholdView shows the status in capitals", () => {
  const item = newTieredWarmupThreshold("code-173", "name-631");
  const view = toTieredWarmupThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredWarmupThresholdViews([item, item]).length, 2, "views");
});
