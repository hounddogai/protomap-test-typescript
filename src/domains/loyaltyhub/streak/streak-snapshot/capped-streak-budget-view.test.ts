import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedStreakBudgetView, toCappedStreakBudgetViews } from "./capped-streak-budget-view.js";
import { newCappedStreakBudget } from "./capped-streak-budget.js";

test("CappedStreakBudgetView shows the status in capitals", () => {
  const item = newCappedStreakBudget("code-369", "title-981");
  const view = toCappedStreakBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedStreakBudgetViews([item, item]).length, 2, "views");
});
