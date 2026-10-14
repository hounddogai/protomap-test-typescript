import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveSlaThresholdEngine } from "./adaptive-sla-threshold-engine.js";
import { newAdaptiveSlaThreshold } from "./adaptive-sla-threshold.js";

test("AdaptiveSlaThresholdEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveSlaThresholdEngine(flags.newRegistry());
  const item = newAdaptiveSlaThreshold("code-358", "name-94");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
