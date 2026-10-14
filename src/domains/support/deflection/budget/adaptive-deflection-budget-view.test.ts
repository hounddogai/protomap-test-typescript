import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveDeflectionBudgetView,
  toAdaptiveDeflectionBudgetViews,
} from "./adaptive-deflection-budget-view.js";
import { newAdaptiveDeflectionBudget } from "./adaptive-deflection-budget.js";

test("AdaptiveDeflectionBudgetView shows the status in capitals", () => {
  const item = newAdaptiveDeflectionBudget("code-276", "title-208");
  const view = toAdaptiveDeflectionBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveDeflectionBudgetViews([item, item]).length, 2, "views");
});
