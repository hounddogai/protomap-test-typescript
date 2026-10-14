import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierThresholdView, toTierThresholdViews } from "./tier-threshold-view.js";
import { newTierThreshold } from "./tier-threshold.js";

test("TierThresholdView shows the status in capitals", () => {
  const item = newTierThreshold("code-995", "label-156");
  const view = toTierThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierThresholdViews([item, item]).length, 2, "views");
});
