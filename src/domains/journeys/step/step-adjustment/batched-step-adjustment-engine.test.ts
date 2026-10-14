import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedStepAdjustmentEngine } from "./batched-step-adjustment-engine.js";
import { newBatchedStepAdjustment } from "./batched-step-adjustment.js";

test("BatchedStepAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultBatchedStepAdjustmentEngine();
  const item = newBatchedStepAdjustment("code-578", "name-491");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
