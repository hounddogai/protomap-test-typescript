import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationPlanEngine } from "./reputation-plan-engine.js";
import { newReputationPlan } from "./reputation-plan.js";

test("ReputationPlanEngine keeps results within bounds", () => {
  const engine = defaultReputationPlanEngine(flags.newRegistry());
  const item = newReputationPlan("code-591", "title-4");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
