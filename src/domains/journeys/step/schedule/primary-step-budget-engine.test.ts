import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryStepBudgetEngine } from "./primary-step-budget-engine.js";
import { newPrimaryStepBudget } from "./primary-step-budget.js";

test("PrimaryStepBudgetEngine keeps results within bounds", () => {
  const engine = defaultPrimaryStepBudgetEngine(flags.newRegistry());
  const item = newPrimaryStepBudget("code-72", "label-885");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
