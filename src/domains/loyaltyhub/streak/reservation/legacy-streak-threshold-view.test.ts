import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyStreakThresholdView, toLegacyStreakThresholdViews } from "./legacy-streak-threshold-view.js";
import { newLegacyStreakThreshold } from "./legacy-streak-threshold.js";

test("LegacyStreakThresholdView shows the status in capitals", () => {
  const item = newLegacyStreakThreshold("code-594", "label-768");
  const view = toLegacyStreakThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyStreakThresholdViews([item, item]).length, 2, "views");
});
