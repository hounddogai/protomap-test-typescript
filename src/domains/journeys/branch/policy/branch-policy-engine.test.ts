import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchPolicyEngine } from "./branch-policy-engine.js";
import { newBranchPolicy } from "./branch-policy.js";

test("BranchPolicyEngine keeps results within bounds", () => {
  const engine = defaultBranchPolicyEngine();
  const item = newBranchPolicy("code-999", "name-197");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
