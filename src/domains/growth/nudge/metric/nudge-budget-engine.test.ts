import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultNudgeBudgetEngine } from "./nudge-budget-engine.js";
import { newNudgeBudget } from "./nudge-budget.js";

test("NudgeBudgetEngine keeps results within bounds", () => {
  const engine = defaultNudgeBudgetEngine(flags.newRegistry());
  const item = newNudgeBudget("code-757", "label-4");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
