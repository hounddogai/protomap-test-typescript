import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardPolicy } from "./leaderboard-policy.js";

test("LeaderboardPolicy starts in open", () => {
  const item = newLeaderboardPolicy("code-665", "label-575");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardPolicy moves to in review", () => {
  const item = newLeaderboardPolicy("code-665", "label-575");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LeaderboardPolicy rejects moves from archived", () => {
  const item = newLeaderboardPolicy("code-665", "label-575");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
