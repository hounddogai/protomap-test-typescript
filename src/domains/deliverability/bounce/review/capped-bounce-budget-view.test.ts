import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedBounceBudgetView, toCappedBounceBudgetViews } from "./capped-bounce-budget-view.js";
import { newCappedBounceBudget } from "./capped-bounce-budget.js";

test("CappedBounceBudgetView shows the status in capitals", () => {
  const item = newCappedBounceBudget("code-589", "name-946");
  const view = toCappedBounceBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedBounceBudgetViews([item, item]).length, 2, "views");
});
