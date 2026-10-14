import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingStreakBudgetView, toPendingStreakBudgetViews } from "./pending-streak-budget-view.js";
import { newPendingStreakBudget } from "./pending-streak-budget.js";

test("PendingStreakBudgetView shows the status in capitals", () => {
  const item = newPendingStreakBudget("code-88", "title-946");
  const view = toPendingStreakBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingStreakBudgetViews([item, item]).length, 2, "views");
});
