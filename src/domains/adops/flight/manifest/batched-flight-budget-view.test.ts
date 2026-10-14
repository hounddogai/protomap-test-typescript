import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedFlightBudgetView, toBatchedFlightBudgetViews } from "./batched-flight-budget-view.js";
import { newBatchedFlightBudget } from "./batched-flight-budget.js";

test("BatchedFlightBudgetView shows the status in capitals", () => {
  const item = newBatchedFlightBudget("code-312", "name-345");
  const view = toBatchedFlightBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedFlightBudgetViews([item, item]).length, 2, "views");
});
