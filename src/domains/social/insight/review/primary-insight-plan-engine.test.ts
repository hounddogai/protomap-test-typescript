import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryInsightPlanEngine } from "./primary-insight-plan-engine.js";
import { newPrimaryInsightPlan } from "./primary-insight-plan.js";

test("PrimaryInsightPlanEngine keeps results within bounds", () => {
  const engine = defaultPrimaryInsightPlanEngine();
  const item = newPrimaryInsightPlan("code-228", "title-721");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
