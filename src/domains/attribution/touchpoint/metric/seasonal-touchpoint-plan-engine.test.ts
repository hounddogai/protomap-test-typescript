import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalTouchpointPlanEngine } from "./seasonal-touchpoint-plan-engine.js";
import { newSeasonalTouchpointPlan } from "./seasonal-touchpoint-plan.js";

test("SeasonalTouchpointPlanEngine keeps results within bounds", () => {
  const engine = defaultSeasonalTouchpointPlanEngine();
  const item = newSeasonalTouchpointPlan("code-253", "title-719");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
