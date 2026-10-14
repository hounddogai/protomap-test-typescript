import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedOptOutPlanEngine } from "./batched-opt-out-plan-engine.js";
import { newBatchedOptOutPlan } from "./batched-opt-out-plan.js";

test("BatchedOptOutPlanEngine keeps results within bounds", () => {
  const engine = defaultBatchedOptOutPlanEngine();
  const item = newBatchedOptOutPlan("code-966", "label-600");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
