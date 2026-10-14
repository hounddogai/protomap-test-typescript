import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultChallengeThresholdEngine } from "./challenge-threshold-engine.js";
import { newChallengeThreshold } from "./challenge-threshold.js";

test("ChallengeThresholdEngine keeps results within bounds", () => {
  const engine = defaultChallengeThresholdEngine();
  const item = newChallengeThreshold("code-92", "name-175");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
