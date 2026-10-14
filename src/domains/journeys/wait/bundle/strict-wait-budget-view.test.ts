import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictWaitBudgetView, toStrictWaitBudgetViews } from "./strict-wait-budget-view.js";
import { newStrictWaitBudget } from "./strict-wait-budget.js";

test("StrictWaitBudgetView shows the status in capitals", () => {
  const item = newStrictWaitBudget("code-342", "title-98");
  const view = toStrictWaitBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictWaitBudgetViews([item, item]).length, 2, "views");
});
