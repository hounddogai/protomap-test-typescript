import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedLeaderboardReservation } from "./weighted-leaderboard-reservation.js";

test("WeightedLeaderboardReservation starts in planned", () => {
  const item = newWeightedLeaderboardReservation("code-162", "title-584");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedLeaderboardReservation moves to cancelled", () => {
  const item = newWeightedLeaderboardReservation("code-162", "title-584");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("WeightedLeaderboardReservation rejects moves from cancelled", () => {
  const item = newWeightedLeaderboardReservation("code-162", "title-584");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
