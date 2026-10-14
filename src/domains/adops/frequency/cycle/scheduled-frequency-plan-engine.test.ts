import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledFrequencyPlanEngine } from "./scheduled-frequency-plan-engine.js";
import { newScheduledFrequencyPlan } from "./scheduled-frequency-plan.js";

test("ScheduledFrequencyPlanEngine keeps results within bounds", () => {
  const engine = defaultScheduledFrequencyPlanEngine();
  const item = newScheduledFrequencyPlan("code-641", "title-420");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
