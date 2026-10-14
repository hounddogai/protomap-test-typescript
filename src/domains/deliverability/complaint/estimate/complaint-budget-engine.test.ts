import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultComplaintBudgetEngine } from "./complaint-budget-engine.js";
import { newComplaintBudget } from "./complaint-budget.js";

test("ComplaintBudgetEngine keeps results within bounds", () => {
  const engine = defaultComplaintBudgetEngine();
  const item = newComplaintBudget("code-303", "name-438");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
