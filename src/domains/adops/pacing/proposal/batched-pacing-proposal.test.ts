import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPacingProposal } from "./batched-pacing-proposal.js";

test("BatchedPacingProposal starts in new", () => {
  const item = newBatchedPacingProposal("code-282", "title-57");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPacingProposal moves to done", () => {
  const item = newBatchedPacingProposal("code-282", "title-57");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("BatchedPacingProposal rejects moves from failed", () => {
  const item = newBatchedPacingProposal("code-282", "title-57");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
