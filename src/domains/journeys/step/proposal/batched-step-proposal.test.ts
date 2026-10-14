import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedStepProposal } from "./batched-step-proposal.js";

test("BatchedStepProposal starts in idle", () => {
  const item = newBatchedStepProposal("code-237", "name-973");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedStepProposal moves to stopped", () => {
  const item = newBatchedStepProposal("code-237", "name-973");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("BatchedStepProposal rejects moves from stopped", () => {
  const item = newBatchedStepProposal("code-237", "name-973");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
