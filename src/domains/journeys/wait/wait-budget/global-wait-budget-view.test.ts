import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalWaitBudgetView, toGlobalWaitBudgetViews } from "./global-wait-budget-view.js";
import { newGlobalWaitBudget } from "./global-wait-budget.js";

test("GlobalWaitBudgetView shows the status in capitals", () => {
  const item = newGlobalWaitBudget("code-250", "label-572");
  const view = toGlobalWaitBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalWaitBudgetViews([item, item]).length, 2, "views");
});
