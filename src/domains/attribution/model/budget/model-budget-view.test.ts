import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelBudgetView, toModelBudgetViews } from "./model-budget-view.js";
import { newModelBudget } from "./model-budget.js";

test("ModelBudgetView shows the status in capitals", () => {
  const item = newModelBudget("code-130", "title-1");
  const view = toModelBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelBudgetViews([item, item]).length, 2, "views");
});
