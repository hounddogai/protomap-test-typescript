import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedDeflectionBudgetView, toCappedDeflectionBudgetViews } from "./capped-deflection-budget-view.js";
import { newCappedDeflectionBudget } from "./capped-deflection-budget.js";

test("CappedDeflectionBudgetView shows the status in capitals", () => {
  const item = newCappedDeflectionBudget("code-674", "label-149");
  const view = toCappedDeflectionBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedDeflectionBudgetViews([item, item]).length, 2, "views");
});
