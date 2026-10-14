import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedRetentionCheckpointEngine } from "./batched-retention-checkpoint-engine.js";
import { newBatchedRetentionCheckpoint } from "./batched-retention-checkpoint.js";

test("BatchedRetentionCheckpointEngine keeps results within bounds", () => {
  const engine = defaultBatchedRetentionCheckpointEngine();
  const item = newBatchedRetentionCheckpoint("code-233", "label-198");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
