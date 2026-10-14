import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardBundle } from "./leaderboard-bundle.js";

test("LeaderboardBundle starts in created", () => {
  const item = newLeaderboardBundle("code-551", "label-721");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardBundle moves to published", () => {
  const item = newLeaderboardBundle("code-551", "label-721");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LeaderboardBundle rejects moves from retired", () => {
  const item = newLeaderboardBundle("code-551", "label-721");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
