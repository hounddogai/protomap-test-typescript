import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedPlacementBudgetView, toBatchedPlacementBudgetViews } from "./batched-placement-budget-view.js";
import { newBatchedPlacementBudget } from "./batched-placement-budget.js";

test("BatchedPlacementBudgetView shows the status in capitals", () => {
  const item = newBatchedPlacementBudget("code-740", "name-936");
  const view = toBatchedPlacementBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedPlacementBudgetViews([item, item]).length, 2, "views");
});
