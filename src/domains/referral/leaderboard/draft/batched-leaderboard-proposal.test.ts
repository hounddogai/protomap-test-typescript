import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedLeaderboardProposal } from "./batched-leaderboard-proposal.js";

test("BatchedLeaderboardProposal starts in proposed", () => {
  const item = newBatchedLeaderboardProposal("code-477", "label-734");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedLeaderboardProposal moves to approved", () => {
  const item = newBatchedLeaderboardProposal("code-477", "label-734");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("BatchedLeaderboardProposal rejects moves from withdrawn", () => {
  const item = newBatchedLeaderboardProposal("code-477", "label-734");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
