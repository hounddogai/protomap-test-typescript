import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLeaderboardReservationReport } from "./leaderboard-reservation-report.js";
import { LeaderboardReservation, newLeaderboardReservation } from "./leaderboard-reservation.js";

test("LeaderboardReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_132_662);
  const items: LeaderboardReservation[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLeaderboardReservation(`leaderboard-reservation-${index}`, "sample"));
  }
  const report = buildLeaderboardReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
