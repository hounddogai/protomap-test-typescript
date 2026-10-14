import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalEnrollmentThresholdEngine } from "./seasonal-enrollment-threshold-engine.js";
import { newSeasonalEnrollmentThreshold } from "./seasonal-enrollment-threshold.js";

test("SeasonalEnrollmentThresholdEngine keeps results within bounds", () => {
  const engine = defaultSeasonalEnrollmentThresholdEngine(flags.newRegistry());
  const item = newSeasonalEnrollmentThreshold("code-230", "label-900");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
