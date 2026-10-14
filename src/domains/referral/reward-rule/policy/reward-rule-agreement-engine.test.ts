import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleAgreementEngine } from "./reward-rule-agreement-engine.js";
import { newRewardRuleAgreement } from "./reward-rule-agreement.js";

test("RewardRuleAgreementEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleAgreementEngine(flags.newRegistry());
  const item = newRewardRuleAgreement("code-181", "name-155");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
