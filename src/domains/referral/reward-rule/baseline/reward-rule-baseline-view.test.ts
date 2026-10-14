import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleBaselineView, toRewardRuleBaselineViews } from "./reward-rule-baseline-view.js";
import { newRewardRuleBaseline } from "./reward-rule-baseline.js";

test("RewardRuleBaselineView shows the status in capitals", () => {
  const item = newRewardRuleBaseline("code-989", "name-112");
  const view = toRewardRuleBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleBaselineViews([item, item]).length, 2, "views");
});
