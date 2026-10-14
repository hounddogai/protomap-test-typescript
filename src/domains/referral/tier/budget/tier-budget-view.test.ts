import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierBudgetView, toTierBudgetViews } from "./tier-budget-view.js";
import { newTierBudget } from "./tier-budget.js";

test("TierBudgetView shows the status in capitals", () => {
  const item = newTierBudget("code-613", "label-303");
  const view = toTierBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierBudgetViews([item, item]).length, 2, "views");
});
