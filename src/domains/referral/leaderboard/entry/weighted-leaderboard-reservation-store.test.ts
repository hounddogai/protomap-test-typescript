import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedLeaderboardReservationStore } from "./weighted-leaderboard-reservation-store.js";
import { newWeightedLeaderboardReservation } from "./weighted-leaderboard-reservation.js";

test("MemoryWeightedLeaderboardReservationStore finds what it saved", () => {
  const store = newMemoryWeightedLeaderboardReservationStore();
  const item = newWeightedLeaderboardReservation("code-162", "title-584");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
