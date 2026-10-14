import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualPlacementThresholdEngine } from "./manual-placement-threshold-engine.js";
import { newManualPlacementThreshold } from "./manual-placement-threshold.js";

test("ManualPlacementThresholdEngine keeps results within bounds", () => {
  const engine = defaultManualPlacementThresholdEngine();
  const item = newManualPlacementThreshold("code-771", "label-195");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
