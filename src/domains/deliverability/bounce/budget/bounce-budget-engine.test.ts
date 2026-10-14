import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBounceBudgetEngine } from "./bounce-budget-engine.js";
import { newBounceBudget } from "./bounce-budget.js";

test("BounceBudgetEngine keeps results within bounds", () => {
  const engine = defaultBounceBudgetEngine();
  const item = newBounceBudget("code-489", "name-668");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
