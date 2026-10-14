import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictCreativeBudgetView, toStrictCreativeBudgetViews } from "./strict-creative-budget-view.js";
import { newStrictCreativeBudget } from "./strict-creative-budget.js";

test("StrictCreativeBudgetView shows the status in capitals", () => {
  const item = newStrictCreativeBudget("code-536", "label-558");
  const view = toStrictCreativeBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictCreativeBudgetViews([item, item]).length, 2, "views");
});
