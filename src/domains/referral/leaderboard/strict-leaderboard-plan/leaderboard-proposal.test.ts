import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardProposal } from "./leaderboard-proposal.js";

test("LeaderboardProposal starts in created", () => {
  const item = newLeaderboardProposal("code-696", "label-834");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardProposal moves to validated", () => {
  const item = newLeaderboardProposal("code-696", "label-834");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LeaderboardProposal rejects moves from retired", () => {
  const item = newLeaderboardProposal("code-696", "label-834");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
