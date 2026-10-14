import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardTemplate } from "./leaderboard-template.js";

test("LeaderboardTemplate starts in proposed", () => {
  const item = newLeaderboardTemplate("code-643", "name-96");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardTemplate moves to approved", () => {
  const item = newLeaderboardTemplate("code-643", "name-96");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LeaderboardTemplate rejects moves from withdrawn", () => {
  const item = newLeaderboardTemplate("code-643", "name-96");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
