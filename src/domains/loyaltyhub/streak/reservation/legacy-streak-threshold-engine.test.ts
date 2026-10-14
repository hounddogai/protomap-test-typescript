import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyStreakThresholdEngine } from "./legacy-streak-threshold-engine.js";
import { newLegacyStreakThreshold } from "./legacy-streak-threshold.js";

test("LegacyStreakThresholdEngine keeps results within bounds", () => {
  const engine = defaultLegacyStreakThresholdEngine();
  const item = newLegacyStreakThreshold("code-594", "label-768");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
