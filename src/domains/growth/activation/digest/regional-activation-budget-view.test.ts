import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalActivationBudgetView,
  toRegionalActivationBudgetViews,
} from "./regional-activation-budget-view.js";
import { newRegionalActivationBudget } from "./regional-activation-budget.js";

test("RegionalActivationBudgetView shows the status in capitals", () => {
  const item = newRegionalActivationBudget("code-768", "name-513");
  const view = toRegionalActivationBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalActivationBudgetViews([item, item]).length, 2, "views");
});
