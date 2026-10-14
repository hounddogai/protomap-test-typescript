import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedFlightCheckpointEngine } from "./batched-flight-checkpoint-engine.js";
import { newBatchedFlightCheckpoint } from "./batched-flight-checkpoint.js";

test("BatchedFlightCheckpointEngine keeps results within bounds", () => {
  const engine = defaultBatchedFlightCheckpointEngine();
  const item = newBatchedFlightCheckpoint("code-98", "title-749");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
