import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyPacingPlanEngine } from "./legacy-pacing-plan-engine.js";
import { newLegacyPacingPlan } from "./legacy-pacing-plan.js";

test("LegacyPacingPlanEngine keeps results within bounds", () => {
  const engine = defaultLegacyPacingPlanEngine();
  const item = newLegacyPacingPlan("code-309", "label-911");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
