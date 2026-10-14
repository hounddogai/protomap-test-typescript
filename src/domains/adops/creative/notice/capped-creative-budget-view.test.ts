import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedCreativeBudgetView, toCappedCreativeBudgetViews } from "./capped-creative-budget-view.js";
import { newCappedCreativeBudget } from "./capped-creative-budget.js";

test("CappedCreativeBudgetView shows the status in capitals", () => {
  const item = newCappedCreativeBudget("code-290", "title-462");
  const view = toCappedCreativeBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedCreativeBudgetViews([item, item]).length, 2, "views");
});
