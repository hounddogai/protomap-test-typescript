import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTouchpointBudgetEngine } from "./touchpoint-budget-engine.js";
import { newTouchpointBudget } from "./touchpoint-budget.js";

test("TouchpointBudgetEngine keeps results within bounds", () => {
  const engine = defaultTouchpointBudgetEngine(flags.newRegistry());
  const item = newTouchpointBudget("code-621", "label-280");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
