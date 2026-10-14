import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveChallengeBatchEngine } from "./adaptive-challenge-batch-engine.js";
import { newAdaptiveChallengeBatch } from "./adaptive-challenge-batch.js";

test("AdaptiveChallengeBatchEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveChallengeBatchEngine();
  const item = newAdaptiveChallengeBatch("code-277", "label-725");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
