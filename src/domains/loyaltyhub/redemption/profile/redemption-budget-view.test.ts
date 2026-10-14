import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionBudgetView, toRedemptionBudgetViews } from "./redemption-budget-view.js";
import { newRedemptionBudget } from "./redemption-budget.js";

test("RedemptionBudgetView shows the status in capitals", () => {
  const item = newRedemptionBudget("code-508", "title-345");
  const view = toRedemptionBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionBudgetViews([item, item]).length, 2, "views");
});
