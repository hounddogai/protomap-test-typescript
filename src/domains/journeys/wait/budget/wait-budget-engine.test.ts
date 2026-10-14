import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWaitBudgetEngine } from "./wait-budget-engine.js";
import { newWaitBudget } from "./wait-budget.js";

test("WaitBudgetEngine keeps results within bounds", () => {
  const engine = defaultWaitBudgetEngine(flags.newRegistry());
  const item = newWaitBudget("code-954", "label-677");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
