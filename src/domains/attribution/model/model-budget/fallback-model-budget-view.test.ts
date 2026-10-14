import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackModelBudgetView, toFallbackModelBudgetViews } from "./fallback-model-budget-view.js";
import { newFallbackModelBudget } from "./fallback-model-budget.js";

test("FallbackModelBudgetView shows the status in capitals", () => {
  const item = newFallbackModelBudget("code-443", "label-983");
  const view = toFallbackModelBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackModelBudgetViews([item, item]).length, 2, "views");
});
