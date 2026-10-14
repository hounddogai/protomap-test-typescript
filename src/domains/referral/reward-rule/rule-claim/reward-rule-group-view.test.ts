import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleGroupView, toRewardRuleGroupViews } from "./reward-rule-group-view.js";
import { newRewardRuleGroup } from "./reward-rule-group.js";

test("RewardRuleGroupView shows the status in capitals", () => {
  const item = newRewardRuleGroup("code-179", "name-693");
  const view = toRewardRuleGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleGroupViews([item, item]).length, 2, "views");
});
