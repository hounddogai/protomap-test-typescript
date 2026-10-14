import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedSuppressionPlanEngine } from "./batched-suppression-plan-engine.js";
import { newBatchedSuppressionPlan } from "./batched-suppression-plan.js";

test("BatchedSuppressionPlanEngine keeps results within bounds", () => {
  const engine = defaultBatchedSuppressionPlanEngine();
  const item = newBatchedSuppressionPlan("code-980", "name-398");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
