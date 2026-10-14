import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalBounceBudgetView, toRegionalBounceBudgetViews } from "./regional-bounce-budget-view.js";
import { newRegionalBounceBudget } from "./regional-bounce-budget.js";

test("RegionalBounceBudgetView shows the status in capitals", () => {
  const item = newRegionalBounceBudget("code-952", "label-138");
  const view = toRegionalBounceBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalBounceBudgetViews([item, item]).length, 2, "views");
});
