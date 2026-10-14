import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedMacroCheckpointEngine } from "./batched-macro-checkpoint-engine.js";
import { newBatchedMacroCheckpoint } from "./batched-macro-checkpoint.js";

test("BatchedMacroCheckpointEngine keeps results within bounds", () => {
  const engine = defaultBatchedMacroCheckpointEngine();
  const item = newBatchedMacroCheckpoint("code-686", "title-238");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
