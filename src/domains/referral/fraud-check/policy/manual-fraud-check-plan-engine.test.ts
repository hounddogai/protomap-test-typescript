import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualFraudCheckPlanEngine } from "./manual-fraud-check-plan-engine.js";
import { newManualFraudCheckPlan } from "./manual-fraud-check-plan.js";

test("ManualFraudCheckPlanEngine keeps results within bounds", () => {
  const engine = defaultManualFraudCheckPlanEngine();
  const item = newManualFraudCheckPlan("code-71", "title-720");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
