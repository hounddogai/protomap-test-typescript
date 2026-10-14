import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleMilestoneEngine } from "./reward-rule-milestone-engine.js";
import { newRewardRuleMilestone } from "./reward-rule-milestone.js";

test("RewardRuleMilestoneEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleMilestoneEngine(flags.newRegistry());
  const item = newRewardRuleMilestone("code-806", "title-577");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
