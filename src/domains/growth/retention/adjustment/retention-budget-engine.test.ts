import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRetentionBudgetEngine } from "./retention-budget-engine.js";
import { newRetentionBudget } from "./retention-budget.js";

test("RetentionBudgetEngine keeps results within bounds", () => {
  const engine = defaultRetentionBudgetEngine();
  const item = newRetentionBudget("code-715", "title-205");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
