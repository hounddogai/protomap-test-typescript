import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleQuotaEngine } from "./reward-rule-quota-engine.js";
import { newRewardRuleQuota } from "./reward-rule-quota.js";

test("RewardRuleQuotaEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleQuotaEngine(flags.newRegistry());
  const item = newRewardRuleQuota("code-942", "label-620");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
