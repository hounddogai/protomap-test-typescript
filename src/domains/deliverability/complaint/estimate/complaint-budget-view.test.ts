import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintBudgetView, toComplaintBudgetViews } from "./complaint-budget-view.js";
import { newComplaintBudget } from "./complaint-budget.js";

test("ComplaintBudgetView shows the status in capitals", () => {
  const item = newComplaintBudget("code-303", "name-438");
  const view = toComplaintBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintBudgetViews([item, item]).length, 2, "views");
});
