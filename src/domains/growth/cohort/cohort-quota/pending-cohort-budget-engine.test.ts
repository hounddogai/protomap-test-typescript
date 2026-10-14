import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingCohortBudgetEngine } from "./pending-cohort-budget-engine.js";
import { newPendingCohortBudget } from "./pending-cohort-budget.js";

test("PendingCohortBudgetEngine keeps results within bounds", () => {
  const engine = defaultPendingCohortBudgetEngine();
  const item = newPendingCohortBudget("code-700", "name-99");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
