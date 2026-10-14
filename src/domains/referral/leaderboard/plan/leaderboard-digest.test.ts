import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardDigest } from "./leaderboard-digest.js";

test("LeaderboardDigest starts in planned", () => {
  const item = newLeaderboardDigest("code-386", "name-543");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardDigest moves to scheduled", () => {
  const item = newLeaderboardDigest("code-386", "name-543");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LeaderboardDigest rejects moves from cancelled", () => {
  const item = newLeaderboardDigest("code-386", "name-543");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
