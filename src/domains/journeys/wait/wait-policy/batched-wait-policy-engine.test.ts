import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedWaitPolicyEngine } from "./batched-wait-policy-engine.js";
import { newBatchedWaitPolicy } from "./batched-wait-policy.js";

test("BatchedWaitPolicyEngine keeps results within bounds", () => {
  const engine = defaultBatchedWaitPolicyEngine(flags.newRegistry());
  const item = newBatchedWaitPolicy("code-143", "title-608");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
