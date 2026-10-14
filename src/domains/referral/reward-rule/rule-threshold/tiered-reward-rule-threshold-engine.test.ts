import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredRewardRuleThresholdEngine } from "./tiered-reward-rule-threshold-engine.js";
import { newTieredRewardRuleThreshold } from "./tiered-reward-rule-threshold.js";

test("TieredRewardRuleThresholdEngine keeps results within bounds", () => {
  const engine = defaultTieredRewardRuleThresholdEngine();
  const item = newTieredRewardRuleThreshold("code-399", "label-569");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
