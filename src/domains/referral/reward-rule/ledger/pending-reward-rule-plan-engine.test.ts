import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingRewardRulePlanEngine } from "./pending-reward-rule-plan-engine.js";
import { newPendingRewardRulePlan } from "./pending-reward-rule-plan.js";

test("PendingRewardRulePlanEngine keeps results within bounds", () => {
  const engine = defaultPendingRewardRulePlanEngine(flags.newRegistry());
  const item = newPendingRewardRulePlan("code-151", "label-693");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
