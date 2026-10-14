import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedBranchBudgetView, toWeightedBranchBudgetViews } from "./weighted-branch-budget-view.js";
import { newWeightedBranchBudget } from "./weighted-branch-budget.js";

test("WeightedBranchBudgetView shows the status in capitals", () => {
  const item = newWeightedBranchBudget("code-967", "title-383");
  const view = toWeightedBranchBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedBranchBudgetViews([item, item]).length, 2, "views");
});
