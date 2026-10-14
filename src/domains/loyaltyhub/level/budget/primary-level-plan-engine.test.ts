import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryLevelPlanEngine } from "./primary-level-plan-engine.js";
import { newPrimaryLevelPlan } from "./primary-level-plan.js";

test("PrimaryLevelPlanEngine keeps results within bounds", () => {
  const engine = defaultPrimaryLevelPlanEngine();
  const item = newPrimaryLevelPlan("code-669", "name-793");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
