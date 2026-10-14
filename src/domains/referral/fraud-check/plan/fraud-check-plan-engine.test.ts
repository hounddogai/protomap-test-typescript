import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFraudCheckPlanEngine } from "./fraud-check-plan-engine.js";
import { newFraudCheckPlan } from "./fraud-check-plan.js";

test("FraudCheckPlanEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckPlanEngine(flags.newRegistry());
  const item = newFraudCheckPlan("code-317", "label-562");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
