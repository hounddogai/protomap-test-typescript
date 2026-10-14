import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingRewardRuleAdjustmentEngine } from "./pending-reward-rule-adjustment-engine.js";
import { newPendingRewardRuleAdjustment } from "./pending-reward-rule-adjustment.js";

test("PendingRewardRuleAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultPendingRewardRuleAdjustmentEngine();
  const item = newPendingRewardRuleAdjustment("code-970", "label-381");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
