import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredRewardRuleOverrideEngine } from "./tiered-reward-rule-override-engine.js";
import { newTieredRewardRuleOverride } from "./tiered-reward-rule-override.js";

test("TieredRewardRuleOverrideEngine keeps results within bounds", () => {
  const engine = defaultTieredRewardRuleOverrideEngine();
  const item = newTieredRewardRuleOverride("code-556", "label-922");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
