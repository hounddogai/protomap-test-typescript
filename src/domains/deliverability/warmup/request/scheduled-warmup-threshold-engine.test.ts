import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledWarmupThresholdEngine } from "./scheduled-warmup-threshold-engine.js";
import { newScheduledWarmupThreshold } from "./scheduled-warmup-threshold.js";

test("ScheduledWarmupThresholdEngine keeps results within bounds", () => {
  const engine = defaultScheduledWarmupThresholdEngine();
  const item = newScheduledWarmupThreshold("code-818", "title-901");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
