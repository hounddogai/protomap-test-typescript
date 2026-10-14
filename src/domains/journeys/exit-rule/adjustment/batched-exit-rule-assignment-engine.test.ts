import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedExitRuleAssignmentEngine } from "./batched-exit-rule-assignment-engine.js";
import { newBatchedExitRuleAssignment } from "./batched-exit-rule-assignment.js";

test("BatchedExitRuleAssignmentEngine keeps results within bounds", () => {
  const engine = defaultBatchedExitRuleAssignmentEngine();
  const item = newBatchedExitRuleAssignment("code-472", "title-385");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
