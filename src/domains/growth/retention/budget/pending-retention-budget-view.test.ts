import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingRetentionBudgetView, toPendingRetentionBudgetViews } from "./pending-retention-budget-view.js";
import { newPendingRetentionBudget } from "./pending-retention-budget.js";

test("PendingRetentionBudgetView shows the status in capitals", () => {
  const item = newPendingRetentionBudget("code-378", "label-816");
  const view = toPendingRetentionBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingRetentionBudgetViews([item, item]).length, 2, "views");
});
