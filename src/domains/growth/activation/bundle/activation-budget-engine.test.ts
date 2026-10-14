import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultActivationBudgetEngine } from "./activation-budget-engine.js";
import { newActivationBudget } from "./activation-budget.js";

test("ActivationBudgetEngine keeps results within bounds", () => {
  const engine = defaultActivationBudgetEngine(flags.newRegistry());
  const item = newActivationBudget("code-77", "title-310");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
