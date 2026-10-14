import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingInsightPlanEngine } from "./pending-insight-plan-engine.js";
import { newPendingInsightPlan } from "./pending-insight-plan.js";

test("PendingInsightPlanEngine keeps results within bounds", () => {
  const engine = defaultPendingInsightPlanEngine();
  const item = newPendingInsightPlan("code-692", "name-58");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
