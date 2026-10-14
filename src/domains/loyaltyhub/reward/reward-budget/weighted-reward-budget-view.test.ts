import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedRewardBudgetView, toWeightedRewardBudgetViews } from "./weighted-reward-budget-view.js";
import { newWeightedRewardBudget } from "./weighted-reward-budget.js";

test("WeightedRewardBudgetView shows the status in capitals", () => {
  const item = newWeightedRewardBudget("code-56", "name-844");
  const view = toWeightedRewardBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedRewardBudgetViews([item, item]).length, 2, "views");
});
