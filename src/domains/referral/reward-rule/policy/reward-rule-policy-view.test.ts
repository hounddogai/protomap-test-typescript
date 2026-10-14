import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRulePolicyView, toRewardRulePolicyViews } from "./reward-rule-policy-view.js";
import { newRewardRulePolicy } from "./reward-rule-policy.js";

test("RewardRulePolicyView shows the status in capitals", () => {
  const item = newRewardRulePolicy("code-920", "label-761");
  const view = toRewardRulePolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRulePolicyViews([item, item]).length, 2, "views");
});
