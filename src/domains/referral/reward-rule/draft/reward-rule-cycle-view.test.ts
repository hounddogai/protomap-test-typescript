import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleCycleView, toRewardRuleCycleViews } from "./reward-rule-cycle-view.js";
import { newRewardRuleCycle } from "./reward-rule-cycle.js";

test("RewardRuleCycleView shows the status in capitals", () => {
  const item = newRewardRuleCycle("code-605", "label-230");
  const view = toRewardRuleCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleCycleViews([item, item]).length, 2, "views");
});
