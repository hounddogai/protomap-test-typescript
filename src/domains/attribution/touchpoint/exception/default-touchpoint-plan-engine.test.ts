import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultTouchpointPlanEngine } from "./default-touchpoint-plan-engine.js";
import { newDefaultTouchpointPlan } from "./default-touchpoint-plan.js";

test("DefaultTouchpointPlanEngine keeps results within bounds", () => {
  const engine = defaultDefaultTouchpointPlanEngine();
  const item = newDefaultTouchpointPlan("code-529", "name-683");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
