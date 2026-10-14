import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleBaselineEngine } from "./reward-rule-baseline-engine.js";
import { newRewardRuleBaseline } from "./reward-rule-baseline.js";

test("RewardRuleBaselineEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleBaselineEngine(flags.newRegistry());
  const item = newRewardRuleBaseline("code-989", "name-112");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
