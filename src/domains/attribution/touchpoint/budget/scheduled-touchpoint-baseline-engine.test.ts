import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledTouchpointBaselineEngine } from "./scheduled-touchpoint-baseline-engine.js";
import { newScheduledTouchpointBaseline } from "./scheduled-touchpoint-baseline.js";

test("ScheduledTouchpointBaselineEngine keeps results within bounds", () => {
  const engine = defaultScheduledTouchpointBaselineEngine();
  const item = newScheduledTouchpointBaseline("code-217", "label-288");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
