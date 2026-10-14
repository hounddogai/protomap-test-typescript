import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRulePlanView, toRewardRulePlanViews } from "./reward-rule-plan-view.js";
import { newRewardRulePlan } from "./reward-rule-plan.js";

test("RewardRulePlanView shows the status in capitals", () => {
  const item = newRewardRulePlan("code-822", "title-244");
  const view = toRewardRulePlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRulePlanViews([item, item]).length, 2, "views");
});
