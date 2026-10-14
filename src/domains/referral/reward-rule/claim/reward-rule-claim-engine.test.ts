import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardRuleClaimEngine } from "./reward-rule-claim-engine.js";
import { newRewardRuleClaim } from "./reward-rule-claim.js";

test("RewardRuleClaimEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleClaimEngine();
  const item = newRewardRuleClaim("code-826", "label-349");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
