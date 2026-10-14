import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLevelPlanEngine } from "./level-plan-engine.js";
import { newLevelPlan } from "./level-plan.js";

test("LevelPlanEngine keeps results within bounds", () => {
  const engine = defaultLevelPlanEngine();
  const item = newLevelPlan("code-924", "label-404");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
