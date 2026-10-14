import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaBudgetView, toSlaBudgetViews } from "./sla-budget-view.js";
import { newSlaBudget } from "./sla-budget.js";

test("SlaBudgetView shows the status in capitals", () => {
  const item = newSlaBudget("code-6", "name-683");
  const view = toSlaBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaBudgetViews([item, item]).length, 2, "views");
});
