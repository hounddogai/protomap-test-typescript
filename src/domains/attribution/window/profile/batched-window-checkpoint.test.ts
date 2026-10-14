import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedWindowCheckpoint } from "./batched-window-checkpoint.js";

test("BatchedWindowCheckpoint starts in new", () => {
  const item = newBatchedWindowCheckpoint("code-150", "title-581");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedWindowCheckpoint moves to running", () => {
  const item = newBatchedWindowCheckpoint("code-150", "title-581");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BatchedWindowCheckpoint rejects moves from failed", () => {
  const item = newBatchedWindowCheckpoint("code-150", "title-581");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
