import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedRewardRuleOverrideEngine } from "./batched-reward-rule-override-engine.js";
import { newBatchedRewardRuleOverride } from "./batched-reward-rule-override.js";

test("BatchedRewardRuleOverrideEngine keeps results within bounds", () => {
  const engine = defaultBatchedRewardRuleOverrideEngine();
  const item = newBatchedRewardRuleOverride("code-46", "name-816");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
