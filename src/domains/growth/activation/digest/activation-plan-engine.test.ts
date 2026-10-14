import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultActivationPlanEngine } from "./activation-plan-engine.js";
import { newActivationPlan } from "./activation-plan.js";

test("ActivationPlanEngine keeps results within bounds", () => {
  const engine = defaultActivationPlanEngine();
  const item = newActivationPlan("code-42", "name-303");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
