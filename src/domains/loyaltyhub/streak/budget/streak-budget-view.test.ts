import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakBudgetView, toStreakBudgetViews } from "./streak-budget-view.js";
import { newStreakBudget } from "./streak-budget.js";

test("StreakBudgetView shows the status in capitals", () => {
  const item = newStreakBudget("code-74", "name-514");
  const view = toStreakBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakBudgetViews([item, item]).length, 2, "views");
});
