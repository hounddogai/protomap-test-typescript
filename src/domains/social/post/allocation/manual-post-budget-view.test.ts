import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualPostBudgetView, toManualPostBudgetViews } from "./manual-post-budget-view.js";
import { newManualPostBudget } from "./manual-post-budget.js";

test("ManualPostBudgetView shows the status in capitals", () => {
  const item = newManualPostBudget("code-943", "name-189");
  const view = toManualPostBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualPostBudgetViews([item, item]).length, 2, "views");
});
