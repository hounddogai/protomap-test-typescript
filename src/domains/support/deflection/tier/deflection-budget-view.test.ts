import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionBudgetView, toDeflectionBudgetViews } from "./deflection-budget-view.js";
import { newDeflectionBudget } from "./deflection-budget.js";

test("DeflectionBudgetView shows the status in capitals", () => {
  const item = newDeflectionBudget("code-813", "label-780");
  const view = toDeflectionBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionBudgetViews([item, item]).length, 2, "views");
});
