import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardTarget } from "./leaderboard-target.js";

test("LeaderboardTarget starts in proposed", () => {
  const item = newLeaderboardTarget("code-559", "label-926");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardTarget moves to rejected", () => {
  const item = newLeaderboardTarget("code-559", "label-926");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LeaderboardTarget rejects moves from withdrawn", () => {
  const item = newLeaderboardTarget("code-559", "label-926");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
