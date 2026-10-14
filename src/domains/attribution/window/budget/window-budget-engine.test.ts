import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWindowBudgetEngine } from "./window-budget-engine.js";
import { newWindowBudget } from "./window-budget.js";

test("WindowBudgetEngine keeps results within bounds", () => {
  const engine = defaultWindowBudgetEngine();
  const item = newWindowBudget("code-862", "name-55");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
