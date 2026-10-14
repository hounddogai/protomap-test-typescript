import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedRewardRulePolicyEngine } from "./batched-reward-rule-policy-engine.js";
import { newBatchedRewardRulePolicy } from "./batched-reward-rule-policy.js";

test("BatchedRewardRulePolicyEngine keeps results within bounds", () => {
  const engine = defaultBatchedRewardRulePolicyEngine(flags.newRegistry());
  const item = newBatchedRewardRulePolicy("code-87", "title-579");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
