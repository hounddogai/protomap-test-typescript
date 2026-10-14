import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardTierView, toRewardTierViews } from "./reward-tier-view.js";
import { newRewardTier } from "./reward-tier.js";

test("RewardTierView shows the status in capitals", () => {
  const item = newRewardTier("code-167", "name-357");
  const view = toRewardTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardTierViews([item, item]).length, 2, "views");
});
