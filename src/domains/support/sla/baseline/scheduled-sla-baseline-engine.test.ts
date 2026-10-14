import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledSlaBaselineEngine } from "./scheduled-sla-baseline-engine.js";
import { newScheduledSlaBaseline } from "./scheduled-sla-baseline.js";

test("ScheduledSlaBaselineEngine keeps results within bounds", () => {
  const engine = defaultScheduledSlaBaselineEngine();
  const item = newScheduledSlaBaseline("code-817", "title-947");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
