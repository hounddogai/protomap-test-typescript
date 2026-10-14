import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriptionBudgetView, toSubscriptionBudgetViews } from "./subscription-budget-view.js";
import { newSubscriptionBudget } from "./subscription-budget.js";

test("SubscriptionBudgetView shows the status in capitals", () => {
  const item = newSubscriptionBudget("code-790", "title-135");
  const view = toSubscriptionBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSubscriptionBudgetViews([item, item]).length, 2, "views");
});
