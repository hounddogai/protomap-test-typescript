import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredRewardRuleAdjustmentEngine } from "./tiered-reward-rule-adjustment-engine.js";
import { newTieredRewardRuleAdjustment } from "./tiered-reward-rule-adjustment.js";

test("TieredRewardRuleAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultTieredRewardRuleAdjustmentEngine();
  const item = newTieredRewardRuleAdjustment("code-809", "title-334");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
