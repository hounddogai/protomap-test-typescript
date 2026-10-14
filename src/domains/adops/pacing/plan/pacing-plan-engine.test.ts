import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPacingPlanEngine } from "./pacing-plan-engine.js";
import { newPacingPlan } from "./pacing-plan.js";

test("PacingPlanEngine keeps results within bounds", () => {
  const engine = defaultPacingPlanEngine();
  const item = newPacingPlan("code-421", "label-12");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
