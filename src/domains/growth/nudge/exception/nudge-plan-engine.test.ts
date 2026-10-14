import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultNudgePlanEngine } from "./nudge-plan-engine.js";
import { newNudgePlan } from "./nudge-plan.js";

test("NudgePlanEngine keeps results within bounds", () => {
  const engine = defaultNudgePlanEngine();
  const item = newNudgePlan("code-966", "label-396");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
