import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptivePreferenceBudgetView,
  toAdaptivePreferenceBudgetViews,
} from "./adaptive-preference-budget-view.js";
import { newAdaptivePreferenceBudget } from "./adaptive-preference-budget.js";

test("AdaptivePreferenceBudgetView shows the status in capitals", () => {
  const item = newAdaptivePreferenceBudget("code-926", "label-767");
  const view = toAdaptivePreferenceBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptivePreferenceBudgetViews([item, item]).length, 2, "views");
});
