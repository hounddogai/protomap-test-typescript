import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardMapping } from "./leaderboard-mapping.js";

test("LeaderboardMapping starts in proposed", () => {
  const item = newLeaderboardMapping("code-192", "name-295");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardMapping moves to approved", () => {
  const item = newLeaderboardMapping("code-192", "name-295");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LeaderboardMapping rejects moves from withdrawn", () => {
  const item = newLeaderboardMapping("code-192", "name-295");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
