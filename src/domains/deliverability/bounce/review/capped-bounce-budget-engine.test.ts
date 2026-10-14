import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedBounceBudgetEngine } from "./capped-bounce-budget-engine.js";
import { newCappedBounceBudget } from "./capped-bounce-budget.js";

test("CappedBounceBudgetEngine keeps results within bounds", () => {
  const engine = defaultCappedBounceBudgetEngine();
  const item = newCappedBounceBudget("code-589", "name-946");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
