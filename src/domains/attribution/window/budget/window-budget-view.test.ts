import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowBudgetView, toWindowBudgetViews } from "./window-budget-view.js";
import { newWindowBudget } from "./window-budget.js";

test("WindowBudgetView shows the status in capitals", () => {
  const item = newWindowBudget("code-862", "name-55");
  const view = toWindowBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowBudgetViews([item, item]).length, 2, "views");
});
