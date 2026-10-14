import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleAllocationView, toRewardRuleAllocationViews } from "./reward-rule-allocation-view.js";
import { newRewardRuleAllocation } from "./reward-rule-allocation.js";

test("RewardRuleAllocationView shows the status in capitals", () => {
  const item = newRewardRuleAllocation("code-445", "label-266");
  const view = toRewardRuleAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleAllocationViews([item, item]).length, 2, "views");
});
