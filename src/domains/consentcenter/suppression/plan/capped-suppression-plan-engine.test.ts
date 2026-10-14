import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedSuppressionPlanEngine } from "./capped-suppression-plan-engine.js";
import { newCappedSuppressionPlan } from "./capped-suppression-plan.js";

test("CappedSuppressionPlanEngine keeps results within bounds", () => {
  const engine = defaultCappedSuppressionPlanEngine(flags.newRegistry());
  const item = newCappedSuppressionPlan("code-794", "label-514");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
