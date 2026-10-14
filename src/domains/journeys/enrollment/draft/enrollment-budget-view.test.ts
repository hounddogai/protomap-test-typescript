import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentBudgetView, toEnrollmentBudgetViews } from "./enrollment-budget-view.js";
import { newEnrollmentBudget } from "./enrollment-budget.js";

test("EnrollmentBudgetView shows the status in capitals", () => {
  const item = newEnrollmentBudget("code-166", "label-493");
  const view = toEnrollmentBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentBudgetViews([item, item]).length, 2, "views");
});
