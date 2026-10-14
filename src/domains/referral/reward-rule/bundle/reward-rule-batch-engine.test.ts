import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleBatchEngine } from "./reward-rule-batch-engine.js";
import { newRewardRuleBatch } from "./reward-rule-batch.js";

test("RewardRuleBatchEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleBatchEngine(flags.newRegistry());
  const item = newRewardRuleBatch("code-69", "name-765");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
