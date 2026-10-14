import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictLevelBudgetEngine } from "./strict-level-budget-engine.js";
import { newStrictLevelBudget } from "./strict-level-budget.js";

test("StrictLevelBudgetEngine keeps results within bounds", () => {
  const engine = defaultStrictLevelBudgetEngine();
  const item = newStrictLevelBudget("code-497", "label-149");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
