import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCohortBudgetEngine } from "./cohort-budget-engine.js";
import { newCohortBudget } from "./cohort-budget.js";

test("CohortBudgetEngine keeps results within bounds", () => {
  const engine = defaultCohortBudgetEngine();
  const item = newCohortBudget("code-471", "title-362");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
