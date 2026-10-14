import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedInsightAllocationEngine } from "./batched-insight-allocation-engine.js";
import { newBatchedInsightAllocation } from "./batched-insight-allocation.js";

test("BatchedInsightAllocationEngine keeps results within bounds", () => {
  const engine = defaultBatchedInsightAllocationEngine(flags.newRegistry());
  const item = newBatchedInsightAllocation("code-427", "label-372");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
