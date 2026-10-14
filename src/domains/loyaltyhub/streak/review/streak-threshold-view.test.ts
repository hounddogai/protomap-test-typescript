import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakThresholdView, toStreakThresholdViews } from "./streak-threshold-view.js";
import { newStreakThreshold } from "./streak-threshold.js";

test("StreakThresholdView shows the status in capitals", () => {
  const item = newStreakThreshold("code-450", "name-846");
  const view = toStreakThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakThresholdViews([item, item]).length, 2, "views");
});
