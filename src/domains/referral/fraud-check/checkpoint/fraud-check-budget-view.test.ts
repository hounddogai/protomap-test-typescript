import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckBudgetView, toFraudCheckBudgetViews } from "./fraud-check-budget-view.js";
import { newFraudCheckBudget } from "./fraud-check-budget.js";

test("FraudCheckBudgetView shows the status in capitals", () => {
  const item = newFraudCheckBudget("code-537", "label-249");
  const view = toFraudCheckBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckBudgetViews([item, item]).length, 2, "views");
});
