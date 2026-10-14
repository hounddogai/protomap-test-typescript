import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingRewardRulePlanView, toPendingRewardRulePlanViews } from "./pending-reward-rule-plan-view.js";
import { newPendingRewardRulePlan } from "./pending-reward-rule-plan.js";

test("PendingRewardRulePlanView shows the status in capitals", () => {
  const item = newPendingRewardRulePlan("code-151", "label-693");
  const view = toPendingRewardRulePlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingRewardRulePlanViews([item, item]).length, 2, "views");
});
