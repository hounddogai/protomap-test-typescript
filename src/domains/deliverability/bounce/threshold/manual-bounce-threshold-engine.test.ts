import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualBounceThresholdEngine } from "./manual-bounce-threshold-engine.js";
import { newManualBounceThreshold } from "./manual-bounce-threshold.js";

test("ManualBounceThresholdEngine keeps results within bounds", () => {
  const engine = defaultManualBounceThresholdEngine(flags.newRegistry());
  const item = newManualBounceThreshold("code-897", "name-689");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
