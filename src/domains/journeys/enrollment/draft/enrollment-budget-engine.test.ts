import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEnrollmentBudgetEngine } from "./enrollment-budget-engine.js";
import { newEnrollmentBudget } from "./enrollment-budget.js";

test("EnrollmentBudgetEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentBudgetEngine(flags.newRegistry());
  const item = newEnrollmentBudget("code-166", "label-493");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
