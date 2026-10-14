import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationBudgetView, toActivationBudgetViews } from "./activation-budget-view.js";
import { newActivationBudget } from "./activation-budget.js";

test("ActivationBudgetView shows the status in capitals", () => {
  const item = newActivationBudget("code-77", "title-310");
  const view = toActivationBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationBudgetViews([item, item]).length, 2, "views");
});
