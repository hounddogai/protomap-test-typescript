import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierThresholdEngine } from "./tier-threshold-engine.js";
import { newTierThreshold } from "./tier-threshold.js";

test("TierThresholdEngine keeps results within bounds", () => {
  const engine = defaultTierThresholdEngine(flags.newRegistry());
  const item = newTierThreshold("code-995", "label-156");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
