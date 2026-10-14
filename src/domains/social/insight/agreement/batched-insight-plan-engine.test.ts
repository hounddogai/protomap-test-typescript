import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedInsightPlanEngine } from "./batched-insight-plan-engine.js";
import { newBatchedInsightPlan } from "./batched-insight-plan.js";

test("BatchedInsightPlanEngine keeps results within bounds", () => {
  const engine = defaultBatchedInsightPlanEngine();
  const item = newBatchedInsightPlan("code-832", "name-564");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
