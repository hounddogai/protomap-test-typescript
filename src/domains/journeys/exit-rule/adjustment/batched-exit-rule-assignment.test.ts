import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedExitRuleAssignment } from "./batched-exit-rule-assignment.js";

test("BatchedExitRuleAssignment starts in idle", () => {
  const item = newBatchedExitRuleAssignment("code-472", "title-385");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedExitRuleAssignment moves to stopped", () => {
  const item = newBatchedExitRuleAssignment("code-472", "title-385");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("BatchedExitRuleAssignment rejects moves from stopped", () => {
  const item = newBatchedExitRuleAssignment("code-472", "title-385");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
