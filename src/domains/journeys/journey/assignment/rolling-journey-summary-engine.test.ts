import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingJourneySummaryEngine } from "./rolling-journey-summary-engine.js";
import { newRollingJourneySummary } from "./rolling-journey-summary.js";

test("RollingJourneySummaryEngine keeps results within bounds", () => {
  const engine = defaultRollingJourneySummaryEngine(flags.newRegistry());
  const item = newRollingJourneySummary("code-660", "name-622");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
