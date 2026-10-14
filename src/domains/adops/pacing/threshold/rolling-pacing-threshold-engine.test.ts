import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingPacingThresholdEngine } from "./rolling-pacing-threshold-engine.js";
import { newRollingPacingThreshold } from "./rolling-pacing-threshold.js";

test("RollingPacingThresholdEngine keeps results within bounds", () => {
  const engine = defaultRollingPacingThresholdEngine();
  const item = newRollingPacingThreshold("code-106", "name-369");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
