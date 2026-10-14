import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyBudgetView, toFrequencyBudgetViews } from "./frequency-budget-view.js";
import { newFrequencyBudget } from "./frequency-budget.js";

test("FrequencyBudgetView shows the status in capitals", () => {
  const item = newFrequencyBudget("code-881", "title-769");
  const view = toFrequencyBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyBudgetViews([item, item]).length, 2, "views");
});
