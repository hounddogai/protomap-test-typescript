import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLeaderboardScheduleReport } from "./leaderboard-schedule-report.js";
import { LeaderboardSchedule, newLeaderboardSchedule } from "./leaderboard-schedule.js";

test("LeaderboardScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_258_803);
  const items: LeaderboardSchedule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLeaderboardSchedule(`leaderboard-schedule-${index}`, "sample"));
  }
  const report = buildLeaderboardScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
