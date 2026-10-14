import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedWaitPolicy } from "./batched-wait-policy.js";

test("BatchedWaitPolicy starts in idle", () => {
  const item = newBatchedWaitPolicy("code-143", "title-608");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedWaitPolicy moves to stopped", () => {
  const item = newBatchedWaitPolicy("code-143", "title-608");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("BatchedWaitPolicy rejects moves from stopped", () => {
  const item = newBatchedWaitPolicy("code-143", "title-608");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
