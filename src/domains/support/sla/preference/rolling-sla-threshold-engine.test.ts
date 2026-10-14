import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingSlaThresholdEngine } from "./rolling-sla-threshold-engine.js";
import { newRollingSlaThreshold } from "./rolling-sla-threshold.js";

test("RollingSlaThresholdEngine keeps results within bounds", () => {
  const engine = defaultRollingSlaThresholdEngine(flags.newRegistry());
  const item = newRollingSlaThreshold("code-8", "title-262");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
