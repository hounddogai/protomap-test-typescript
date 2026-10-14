import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedStreakException } from "./batched-streak-exception.js";

test("BatchedStreakException starts in idle", () => {
  const item = newBatchedStreakException("code-142", "label-19");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedStreakException moves to warming", () => {
  const item = newBatchedStreakException("code-142", "label-19");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("BatchedStreakException rejects moves from stopped", () => {
  const item = newBatchedStreakException("code-142", "label-19");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
