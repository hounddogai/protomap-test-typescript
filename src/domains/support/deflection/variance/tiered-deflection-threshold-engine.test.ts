import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredDeflectionThresholdEngine } from "./tiered-deflection-threshold-engine.js";
import { newTieredDeflectionThreshold } from "./tiered-deflection-threshold.js";

test("TieredDeflectionThresholdEngine keeps results within bounds", () => {
  const engine = defaultTieredDeflectionThresholdEngine(flags.newRegistry());
  const item = newTieredDeflectionThreshold("code-49", "label-599");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
