import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingJourneyBaselineEngine } from "./rolling-journey-baseline-engine.js";
import { newRollingJourneyBaseline } from "./rolling-journey-baseline.js";

test("RollingJourneyBaselineEngine keeps results within bounds", () => {
  const engine = defaultRollingJourneyBaselineEngine(flags.newRegistry());
  const item = newRollingJourneyBaseline("code-208", "title-987");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
