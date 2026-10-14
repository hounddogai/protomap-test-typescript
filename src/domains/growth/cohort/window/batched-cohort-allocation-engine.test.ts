import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedCohortAllocationEngine } from "./batched-cohort-allocation-engine.js";
import { newBatchedCohortAllocation } from "./batched-cohort-allocation.js";

test("BatchedCohortAllocationEngine keeps results within bounds", () => {
  const engine = defaultBatchedCohortAllocationEngine();
  const item = newBatchedCohortAllocation("code-197", "name-240");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
