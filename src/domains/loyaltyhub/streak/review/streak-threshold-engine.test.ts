import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStreakThresholdEngine } from "./streak-threshold-engine.js";
import { newStreakThreshold } from "./streak-threshold.js";

test("StreakThresholdEngine keeps results within bounds", () => {
  const engine = defaultStreakThresholdEngine();
  const item = newStreakThreshold("code-450", "name-846");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
