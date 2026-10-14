import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedLeaderboardReservationView,
  toWeightedLeaderboardReservationViews,
} from "./weighted-leaderboard-reservation-view.js";
import { newWeightedLeaderboardReservation } from "./weighted-leaderboard-reservation.js";

test("WeightedLeaderboardReservationView shows the status in capitals", () => {
  const item = newWeightedLeaderboardReservation("code-162", "title-584");
  const view = toWeightedLeaderboardReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedLeaderboardReservationViews([item, item]).length, 2, "views");
});
