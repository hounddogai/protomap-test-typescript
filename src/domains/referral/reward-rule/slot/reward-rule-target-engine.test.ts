import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleTargetEngine } from "./reward-rule-target-engine.js";
import { newRewardRuleTarget } from "./reward-rule-target.js";

test("RewardRuleTargetEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleTargetEngine(flags.newRegistry());
  const item = newRewardRuleTarget("code-353", "label-202");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
