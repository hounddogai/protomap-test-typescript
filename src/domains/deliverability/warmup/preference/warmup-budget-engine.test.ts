import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWarmupBudgetEngine } from "./warmup-budget-engine.js";
import { newWarmupBudget } from "./warmup-budget.js";

test("WarmupBudgetEngine keeps results within bounds", () => {
  const engine = defaultWarmupBudgetEngine();
  const item = newWarmupBudget("code-317", "label-118");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
