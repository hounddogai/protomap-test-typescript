import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardPlanEngine } from "./reward-plan-engine.js";
import { newRewardPlan } from "./reward-plan.js";

test("RewardPlanEngine keeps results within bounds", () => {
  const engine = defaultRewardPlanEngine(flags.newRegistry());
  const item = newRewardPlan("code-799", "label-217");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
