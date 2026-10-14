import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardRuleThresholdEngine } from "./reward-rule-threshold-engine.js";
import { newRewardRuleThreshold } from "./reward-rule-threshold.js";

test("RewardRuleThresholdEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleThresholdEngine();
  const item = newRewardRuleThreshold("code-440", "label-295");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
