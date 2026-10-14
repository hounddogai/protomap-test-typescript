import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictCreativeBudgetEngine } from "./strict-creative-budget-engine.js";
import { newStrictCreativeBudget } from "./strict-creative-budget.js";

test("StrictCreativeBudgetEngine keeps results within bounds", () => {
  const engine = defaultStrictCreativeBudgetEngine(flags.newRegistry());
  const item = newStrictCreativeBudget("code-536", "label-558");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
