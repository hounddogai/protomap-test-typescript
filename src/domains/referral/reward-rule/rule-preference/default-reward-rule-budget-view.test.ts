import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultRewardRuleBudgetView, toDefaultRewardRuleBudgetViews } from "./default-reward-rule-budget-view.js";
import { newDefaultRewardRuleBudget } from "./default-reward-rule-budget.js";

test("DefaultRewardRuleBudgetView shows the status in capitals", () => {
  const item = newDefaultRewardRuleBudget("code-907", "title-403");
  const view = toDefaultRewardRuleBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultRewardRuleBudgetViews([item, item]).length, 2, "views");
});
