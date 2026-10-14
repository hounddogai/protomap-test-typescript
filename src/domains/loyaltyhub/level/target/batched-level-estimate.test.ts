import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedLevelEstimate } from "./batched-level-estimate.js";

test("BatchedLevelEstimate starts in open", () => {
  const item = newBatchedLevelEstimate("code-356", "name-9");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedLevelEstimate moves to resolved", () => {
  const item = newBatchedLevelEstimate("code-356", "name-9");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("BatchedLevelEstimate rejects moves from archived", () => {
  const item = newBatchedLevelEstimate("code-356", "name-9");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
