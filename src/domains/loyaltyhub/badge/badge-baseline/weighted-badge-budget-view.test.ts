import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedBadgeBudgetView, toWeightedBadgeBudgetViews } from "./weighted-badge-budget-view.js";
import { newWeightedBadgeBudget } from "./weighted-badge-budget.js";

test("WeightedBadgeBudgetView shows the status in capitals", () => {
  const item = newWeightedBadgeBudget("code-656", "title-376");
  const view = toWeightedBadgeBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedBadgeBudgetViews([item, item]).length, 2, "views");
});
