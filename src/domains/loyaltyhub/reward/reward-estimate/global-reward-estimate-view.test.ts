import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalRewardEstimateView, toGlobalRewardEstimateViews } from "./global-reward-estimate-view.js";
import { newGlobalRewardEstimate } from "./global-reward-estimate.js";

test("GlobalRewardEstimateView shows the status in capitals", () => {
  const item = newGlobalRewardEstimate("code-41", "title-856");
  const view = toGlobalRewardEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalRewardEstimateViews([item, item]).length, 2, "views");
});
