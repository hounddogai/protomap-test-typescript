import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedTouchpointVarianceEngine } from "./batched-touchpoint-variance-engine.js";
import { newBatchedTouchpointVariance } from "./batched-touchpoint-variance.js";

test("BatchedTouchpointVarianceEngine keeps results within bounds", () => {
  const engine = defaultBatchedTouchpointVarianceEngine();
  const item = newBatchedTouchpointVariance("code-135", "title-589");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
