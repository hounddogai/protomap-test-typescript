import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyCreditThresholdEngine } from "./legacy-credit-threshold-engine.js";
import { newLegacyCreditThreshold } from "./legacy-credit-threshold.js";

test("LegacyCreditThresholdEngine keeps results within bounds", () => {
  const engine = defaultLegacyCreditThresholdEngine(flags.newRegistry());
  const item = newLegacyCreditThreshold("code-103", "title-58");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
