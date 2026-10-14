import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardEstimateView, toRewardEstimateViews } from "./reward-estimate-view.js";
import { newRewardEstimate } from "./reward-estimate.js";

test("RewardEstimateView shows the status in capitals", () => {
  const item = newRewardEstimate("code-567", "title-880");
  const view = toRewardEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardEstimateViews([item, item]).length, 2, "views");
});
