import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardRuleCheckpointEngine } from "./reward-rule-checkpoint-engine.js";
import { newRewardRuleCheckpoint } from "./reward-rule-checkpoint.js";

test("RewardRuleCheckpointEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleCheckpointEngine();
  const item = newRewardRuleCheckpoint("code-328", "name-140");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
