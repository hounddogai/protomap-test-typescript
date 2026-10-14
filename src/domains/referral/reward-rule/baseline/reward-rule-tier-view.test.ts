import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleTierView, toRewardRuleTierViews } from "./reward-rule-tier-view.js";
import { newRewardRuleTier } from "./reward-rule-tier.js";

test("RewardRuleTierView shows the status in capitals", () => {
  const item = newRewardRuleTier("code-354", "label-936");
  const view = toRewardRuleTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleTierViews([item, item]).length, 2, "views");
});
