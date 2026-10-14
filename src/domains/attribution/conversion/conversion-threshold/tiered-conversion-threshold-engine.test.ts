import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredConversionThresholdEngine } from "./tiered-conversion-threshold-engine.js";
import { newTieredConversionThreshold } from "./tiered-conversion-threshold.js";

test("TieredConversionThresholdEngine keeps results within bounds", () => {
  const engine = defaultTieredConversionThresholdEngine();
  const item = newTieredConversionThreshold("code-347", "label-455");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
