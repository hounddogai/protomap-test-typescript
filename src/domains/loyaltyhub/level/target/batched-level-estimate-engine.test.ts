import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedLevelEstimateEngine } from "./batched-level-estimate-engine.js";
import { newBatchedLevelEstimate } from "./batched-level-estimate.js";

test("BatchedLevelEstimateEngine keeps results within bounds", () => {
  const engine = defaultBatchedLevelEstimateEngine(flags.newRegistry());
  const item = newBatchedLevelEstimate("code-356", "name-9");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
