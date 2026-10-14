import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveCreditBudgetView, toAdaptiveCreditBudgetViews } from "./adaptive-credit-budget-view.js";
import { newAdaptiveCreditBudget } from "./adaptive-credit-budget.js";

test("AdaptiveCreditBudgetView shows the status in capitals", () => {
  const item = newAdaptiveCreditBudget("code-353", "title-284");
  const view = toAdaptiveCreditBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveCreditBudgetViews([item, item]).length, 2, "views");
});
