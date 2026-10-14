import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDeflectionBudgetEngine } from "./deflection-budget-engine.js";
import { newDeflectionBudget } from "./deflection-budget.js";

test("DeflectionBudgetEngine keeps results within bounds", () => {
  const engine = defaultDeflectionBudgetEngine(flags.newRegistry());
  const item = newDeflectionBudget("code-813", "label-780");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
