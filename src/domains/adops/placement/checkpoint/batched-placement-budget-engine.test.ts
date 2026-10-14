import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedPlacementBudgetEngine } from "./batched-placement-budget-engine.js";
import { newBatchedPlacementBudget } from "./batched-placement-budget.js";

test("BatchedPlacementBudgetEngine keeps results within bounds", () => {
  const engine = defaultBatchedPlacementBudgetEngine(flags.newRegistry());
  const item = newBatchedPlacementBudget("code-740", "name-936");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
