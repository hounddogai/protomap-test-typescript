import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryProofBudgetView, toPrimaryProofBudgetViews } from "./primary-proof-budget-view.js";
import { newPrimaryProofBudget } from "./primary-proof-budget.js";

test("PrimaryProofBudgetView shows the status in capitals", () => {
  const item = newPrimaryProofBudget("code-432", "name-706");
  const view = toPrimaryProofBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryProofBudgetViews([item, item]).length, 2, "views");
});
