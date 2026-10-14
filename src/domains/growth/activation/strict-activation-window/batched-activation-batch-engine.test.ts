import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedActivationBatchEngine } from "./batched-activation-batch-engine.js";
import { newBatchedActivationBatch } from "./batched-activation-batch.js";

test("BatchedActivationBatchEngine keeps results within bounds", () => {
  const engine = defaultBatchedActivationBatchEngine(flags.newRegistry());
  const item = newBatchedActivationBatch("code-919", "title-196");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
