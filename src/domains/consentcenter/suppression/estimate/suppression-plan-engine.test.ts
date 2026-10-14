import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSuppressionPlanEngine } from "./suppression-plan-engine.js";
import { newSuppressionPlan } from "./suppression-plan.js";

test("SuppressionPlanEngine keeps results within bounds", () => {
  const engine = defaultSuppressionPlanEngine();
  const item = newSuppressionPlan("code-723", "label-478");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
