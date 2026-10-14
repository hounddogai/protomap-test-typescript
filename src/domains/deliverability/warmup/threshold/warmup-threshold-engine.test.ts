import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWarmupThresholdEngine } from "./warmup-threshold-engine.js";
import { newWarmupThreshold } from "./warmup-threshold.js";

test("WarmupThresholdEngine keeps results within bounds", () => {
  const engine = defaultWarmupThresholdEngine();
  const item = newWarmupThreshold("code-395", "title-7");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
