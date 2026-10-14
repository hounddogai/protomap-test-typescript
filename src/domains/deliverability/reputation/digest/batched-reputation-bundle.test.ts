import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedReputationBundle } from "./batched-reputation-bundle.js";

test("BatchedReputationBundle starts in idle", () => {
  const item = newBatchedReputationBundle("code-609", "title-25");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedReputationBundle moves to stopped", () => {
  const item = newBatchedReputationBundle("code-609", "title-25");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("BatchedReputationBundle rejects moves from stopped", () => {
  const item = newBatchedReputationBundle("code-609", "title-25");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
