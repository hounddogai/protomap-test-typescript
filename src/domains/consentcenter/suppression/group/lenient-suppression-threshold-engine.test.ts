import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientSuppressionThresholdEngine } from "./lenient-suppression-threshold-engine.js";
import { newLenientSuppressionThreshold } from "./lenient-suppression-threshold.js";

test("LenientSuppressionThresholdEngine keeps results within bounds", () => {
  const engine = defaultLenientSuppressionThresholdEngine(flags.newRegistry());
  const item = newLenientSuppressionThreshold("code-258", "name-137");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
