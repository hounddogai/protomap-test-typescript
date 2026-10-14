import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalWaitBudgetEngine } from "./global-wait-budget-engine.js";
import { newGlobalWaitBudget } from "./global-wait-budget.js";

test("GlobalWaitBudgetEngine keeps results within bounds", () => {
  const engine = defaultGlobalWaitBudgetEngine(flags.newRegistry());
  const item = newGlobalWaitBudget("code-250", "label-572");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
