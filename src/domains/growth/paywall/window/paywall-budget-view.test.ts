import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallBudgetView, toPaywallBudgetViews } from "./paywall-budget-view.js";
import { newPaywallBudget } from "./paywall-budget.js";

test("PaywallBudgetView shows the status in capitals", () => {
  const item = newPaywallBudget("code-812", "name-246");
  const view = toPaywallBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallBudgetViews([item, item]).length, 2, "views");
});
