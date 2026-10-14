import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardBaseline } from "./leaderboard-baseline.js";

test("LeaderboardBaseline starts in planned", () => {
  const item = newLeaderboardBaseline("code-781", "title-153");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardBaseline moves to in progress", () => {
  const item = newLeaderboardBaseline("code-781", "title-153");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("LeaderboardBaseline rejects moves from cancelled", () => {
  const item = newLeaderboardBaseline("code-781", "title-153");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
