import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveReputationPlanEngine } from "./adaptive-reputation-plan-engine.js";
import { newAdaptiveReputationPlan } from "./adaptive-reputation-plan.js";

test("AdaptiveReputationPlanEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveReputationPlanEngine(flags.newRegistry());
  const item = newAdaptiveReputationPlan("code-700", "name-817");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
