import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalTouchpointPlanEngine } from "./global-touchpoint-plan-engine.js";
import { newGlobalTouchpointPlan } from "./global-touchpoint-plan.js";

test("GlobalTouchpointPlanEngine keeps results within bounds", () => {
  const engine = defaultGlobalTouchpointPlanEngine();
  const item = newGlobalTouchpointPlan("code-401", "name-962");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
