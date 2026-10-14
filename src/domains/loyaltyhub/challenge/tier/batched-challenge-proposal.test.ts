import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedChallengeProposal } from "./batched-challenge-proposal.js";

test("BatchedChallengeProposal starts in draft", () => {
  const item = newBatchedChallengeProposal("code-574", "label-868");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedChallengeProposal moves to closed", () => {
  const item = newBatchedChallengeProposal("code-574", "label-868");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("BatchedChallengeProposal rejects moves from closed", () => {
  const item = newBatchedChallengeProposal("code-574", "label-868");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
