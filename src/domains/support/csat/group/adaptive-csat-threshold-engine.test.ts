import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveCsatThresholdEngine } from "./adaptive-csat-threshold-engine.js";
import { newAdaptiveCsatThreshold } from "./adaptive-csat-threshold.js";

test("AdaptiveCsatThresholdEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveCsatThresholdEngine(flags.newRegistry());
  const item = newAdaptiveCsatThreshold("code-826", "label-374");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
