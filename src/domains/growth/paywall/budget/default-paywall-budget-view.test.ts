import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultPaywallBudgetView, toDefaultPaywallBudgetViews } from "./default-paywall-budget-view.js";
import { newDefaultPaywallBudget } from "./default-paywall-budget.js";

test("DefaultPaywallBudgetView shows the status in capitals", () => {
  const item = newDefaultPaywallBudget("code-66", "name-545");
  const view = toDefaultPaywallBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultPaywallBudgetViews([item, item]).length, 2, "views");
});
