import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardTier } from "./leaderboard-tier.js";

test("LeaderboardTier starts in created", () => {
  const item = newLeaderboardTier("code-917", "label-401");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardTier moves to validated", () => {
  const item = newLeaderboardTier("code-917", "label-401");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LeaderboardTier rejects moves from retired", () => {
  const item = newLeaderboardTier("code-917", "label-401");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
