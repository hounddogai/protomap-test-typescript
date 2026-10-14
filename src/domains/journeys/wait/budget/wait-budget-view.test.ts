import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitBudgetView, toWaitBudgetViews } from "./wait-budget-view.js";
import { newWaitBudget } from "./wait-budget.js";

test("WaitBudgetView shows the status in capitals", () => {
  const item = newWaitBudget("code-954", "label-677");
  const view = toWaitBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitBudgetViews([item, item]).length, 2, "views");
});
