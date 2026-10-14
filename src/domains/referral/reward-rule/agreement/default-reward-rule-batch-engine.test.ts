import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultRewardRuleBatchEngine } from "./default-reward-rule-batch-engine.js";
import { newDefaultRewardRuleBatch } from "./default-reward-rule-batch.js";

test("DefaultRewardRuleBatchEngine keeps results within bounds", () => {
  const engine = defaultDefaultRewardRuleBatchEngine();
  const item = newDefaultRewardRuleBatch("code-3", "name-826");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
