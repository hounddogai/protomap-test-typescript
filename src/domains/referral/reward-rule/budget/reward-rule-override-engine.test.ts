import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardRuleOverrideEngine } from "./reward-rule-override-engine.js";
import { newRewardRuleOverride } from "./reward-rule-override.js";

test("RewardRuleOverrideEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleOverrideEngine();
  const item = newRewardRuleOverride("code-576", "title-536");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
