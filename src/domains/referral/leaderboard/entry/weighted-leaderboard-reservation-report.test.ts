import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedLeaderboardReservationReport } from "./weighted-leaderboard-reservation-report.js";
import {
  WeightedLeaderboardReservation,
  newWeightedLeaderboardReservation,
} from "./weighted-leaderboard-reservation.js";

test("WeightedLeaderboardReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_030_469);
  const items: WeightedLeaderboardReservation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedLeaderboardReservation(`weighted-leaderboard-reservation-${index}`, "sample"));
  }
  const report = buildWeightedLeaderboardReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
