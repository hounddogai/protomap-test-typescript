import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortBudgetView, toCohortBudgetViews } from "./cohort-budget-view.js";
import { newCohortBudget } from "./cohort-budget.js";

test("CohortBudgetView shows the status in capitals", () => {
  const item = newCohortBudget("code-471", "title-362");
  const view = toCohortBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortBudgetViews([item, item]).length, 2, "views");
});
