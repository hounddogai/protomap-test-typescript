import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledPacingBaselineEngine } from "./scheduled-pacing-baseline-engine.js";
import { newScheduledPacingBaseline } from "./scheduled-pacing-baseline.js";

test("ScheduledPacingBaselineEngine keeps results within bounds", () => {
  const engine = defaultScheduledPacingBaselineEngine();
  const item = newScheduledPacingBaseline("code-205", "label-38");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
