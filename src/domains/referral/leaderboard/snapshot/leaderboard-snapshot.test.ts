import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardSnapshot } from "./leaderboard-snapshot.js";

test("LeaderboardSnapshot starts in proposed", () => {
  const item = newLeaderboardSnapshot("code-81", "name-660");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardSnapshot moves to rejected", () => {
  const item = newLeaderboardSnapshot("code-81", "name-660");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LeaderboardSnapshot rejects moves from withdrawn", () => {
  const item = newLeaderboardSnapshot("code-81", "name-660");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
