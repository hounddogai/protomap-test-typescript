import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedBadgeBudgetEngine } from "./weighted-badge-budget-engine.js";
import { newWeightedBadgeBudget } from "./weighted-badge-budget.js";

test("WeightedBadgeBudgetEngine keeps results within bounds", () => {
  const engine = defaultWeightedBadgeBudgetEngine();
  const item = newWeightedBadgeBudget("code-656", "title-376");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
