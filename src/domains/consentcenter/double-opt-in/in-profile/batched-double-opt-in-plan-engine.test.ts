import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedDoubleOptInPlanEngine } from "./batched-double-opt-in-plan-engine.js";
import { newBatchedDoubleOptInPlan } from "./batched-double-opt-in-plan.js";

test("BatchedDoubleOptInPlanEngine keeps results within bounds", () => {
  const engine = defaultBatchedDoubleOptInPlanEngine();
  const item = newBatchedDoubleOptInPlan("code-325", "name-282");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
