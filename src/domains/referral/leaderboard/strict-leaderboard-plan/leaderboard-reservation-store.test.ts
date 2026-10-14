import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardReservationStore } from "./leaderboard-reservation-store.js";
import { newLeaderboardReservation } from "./leaderboard-reservation.js";

test("MemoryLeaderboardReservationStore finds what it saved", () => {
  const store = newMemoryLeaderboardReservationStore();
  const item = newLeaderboardReservation("code-882", "name-577");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
