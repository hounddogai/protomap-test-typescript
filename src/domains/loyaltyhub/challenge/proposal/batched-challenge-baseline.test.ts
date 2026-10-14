import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedChallengeBaseline } from "./batched-challenge-baseline.js";

test("BatchedChallengeBaseline starts in idle", () => {
  const item = newBatchedChallengeBaseline("code-77", "label-543");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedChallengeBaseline moves to draining", () => {
  const item = newBatchedChallengeBaseline("code-77", "label-543");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("BatchedChallengeBaseline rejects moves from stopped", () => {
  const item = newBatchedChallengeBaseline("code-77", "label-543");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
