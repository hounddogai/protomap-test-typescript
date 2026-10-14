import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualOptOutPlanEngine } from "./manual-opt-out-plan-engine.js";
import { newManualOptOutPlan } from "./manual-opt-out-plan.js";

test("ManualOptOutPlanEngine keeps results within bounds", () => {
  const engine = defaultManualOptOutPlanEngine();
  const item = newManualOptOutPlan("code-191", "name-221");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
