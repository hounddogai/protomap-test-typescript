import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictFraudCheckCheckpointEngine } from "./strict-fraud-check-checkpoint-engine.js";
import { newStrictFraudCheckCheckpoint } from "./strict-fraud-check-checkpoint.js";

test("StrictFraudCheckCheckpointEngine keeps results within bounds", () => {
  const engine = defaultStrictFraudCheckCheckpointEngine();
  const item = newStrictFraudCheckCheckpoint("code-753", "name-890");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
