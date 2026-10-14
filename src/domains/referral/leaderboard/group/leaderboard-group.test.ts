import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardGroup } from "./leaderboard-group.js";

test("LeaderboardGroup starts in created", () => {
  const item = newLeaderboardGroup("code-302", "label-380");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardGroup moves to validated", () => {
  const item = newLeaderboardGroup("code-302", "label-380");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LeaderboardGroup rejects moves from retired", () => {
  const item = newLeaderboardGroup("code-302", "label-380");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
