import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementBudgetView, toPlacementBudgetViews } from "./placement-budget-view.js";
import { newPlacementBudget } from "./placement-budget.js";

test("PlacementBudgetView shows the status in capitals", () => {
  const item = newPlacementBudget("code-12", "title-266");
  const view = toPlacementBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementBudgetViews([item, item]).length, 2, "views");
});
