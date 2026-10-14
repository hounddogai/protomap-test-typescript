import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedQueueProposal } from "./batched-queue-proposal.js";

test("BatchedQueueProposal starts in created", () => {
  const item = newBatchedQueueProposal("code-536", "title-557");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedQueueProposal moves to validated", () => {
  const item = newBatchedQueueProposal("code-536", "title-557");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BatchedQueueProposal rejects moves from retired", () => {
  const item = newBatchedQueueProposal("code-536", "title-557");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
