import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardReservation } from "./leaderboard-reservation.js";

test("LeaderboardReservation starts in new", () => {
  const item = newLeaderboardReservation("code-882", "name-577");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardReservation moves to running", () => {
  const item = newLeaderboardReservation("code-882", "name-577");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LeaderboardReservation rejects moves from failed", () => {
  const item = newLeaderboardReservation("code-882", "name-577");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
