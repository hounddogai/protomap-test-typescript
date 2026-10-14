import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleBudgetView, toBidRuleBudgetViews } from "./bid-rule-budget-view.js";
import { newBidRuleBudget } from "./bid-rule-budget.js";

test("BidRuleBudgetView shows the status in capitals", () => {
  const item = newBidRuleBudget("code-821", "title-316");
  const view = toBidRuleBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleBudgetViews([item, item]).length, 2, "views");
});
