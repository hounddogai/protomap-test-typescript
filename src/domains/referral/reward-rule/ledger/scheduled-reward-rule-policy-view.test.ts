import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledRewardRulePolicyView,
  toScheduledRewardRulePolicyViews,
} from "./scheduled-reward-rule-policy-view.js";
import { newScheduledRewardRulePolicy } from "./scheduled-reward-rule-policy.js";

test("ScheduledRewardRulePolicyView shows the status in capitals", () => {
  const item = newScheduledRewardRulePolicy("code-874", "label-466");
  const view = toScheduledRewardRulePolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledRewardRulePolicyViews([item, item]).length, 2, "views");
});
