import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedWaitRuleEngine } from "./batched-wait-rule-engine.js";
import { newBatchedWaitRule } from "./batched-wait-rule.js";

test("BatchedWaitRuleEngine keeps results within bounds", () => {
  const engine = defaultBatchedWaitRuleEngine();
  const item = newBatchedWaitRule("code-137", "title-587");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
