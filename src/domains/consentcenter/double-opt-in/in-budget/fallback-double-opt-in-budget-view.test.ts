import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackDoubleOptInBudgetView,
  toFallbackDoubleOptInBudgetViews,
} from "./fallback-double-opt-in-budget-view.js";
import { newFallbackDoubleOptInBudget } from "./fallback-double-opt-in-budget.js";

test("FallbackDoubleOptInBudgetView shows the status in capitals", () => {
  const item = newFallbackDoubleOptInBudget("code-316", "name-326");
  const view = toFallbackDoubleOptInBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackDoubleOptInBudgetViews([item, item]).length, 2, "views");
});
