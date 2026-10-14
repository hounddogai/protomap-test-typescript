import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardThresholdView, toRewardThresholdViews } from "./reward-threshold-view.js";
import { newRewardThreshold } from "./reward-threshold.js";

test("RewardThresholdView shows the status in capitals", () => {
  const item = newRewardThreshold("code-222", "label-540");
  const view = toRewardThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardThresholdViews([item, item]).length, 2, "views");
});
