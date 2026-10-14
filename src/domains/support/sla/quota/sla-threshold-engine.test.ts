import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSlaThresholdEngine } from "./sla-threshold-engine.js";
import { newSlaThreshold } from "./sla-threshold.js";

test("SlaThresholdEngine keeps results within bounds", () => {
  const engine = defaultSlaThresholdEngine(flags.newRegistry());
  const item = newSlaThreshold("code-932", "name-945");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
