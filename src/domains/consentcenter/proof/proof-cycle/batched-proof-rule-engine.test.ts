import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedProofRuleEngine } from "./batched-proof-rule-engine.js";
import { newBatchedProofRule } from "./batched-proof-rule.js";

test("BatchedProofRuleEngine keeps results within bounds", () => {
  const engine = defaultBatchedProofRuleEngine(flags.newRegistry());
  const item = newBatchedProofRule("code-912", "title-900");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
