import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedSenderBatchEngine } from "./batched-sender-batch-engine.js";
import { newBatchedSenderBatch } from "./batched-sender-batch.js";

test("BatchedSenderBatchEngine keeps results within bounds", () => {
  const engine = defaultBatchedSenderBatchEngine();
  const item = newBatchedSenderBatch("code-323", "label-988");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
