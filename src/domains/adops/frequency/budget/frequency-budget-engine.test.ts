import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFrequencyBudgetEngine } from "./frequency-budget-engine.js";
import { newFrequencyBudget } from "./frequency-budget.js";

test("FrequencyBudgetEngine keeps results within bounds", () => {
  const engine = defaultFrequencyBudgetEngine(flags.newRegistry());
  const item = newFrequencyBudget("code-881", "title-769");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
