import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLeaderboardBaselineReport } from "./leaderboard-baseline-report.js";
import { LeaderboardBaseline, newLeaderboardBaseline } from "./leaderboard-baseline.js";

test("LeaderboardBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_605_397);
  const items: LeaderboardBaseline[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLeaderboardBaseline(`leaderboard-baseline-${index}`, "sample"));
  }
  const report = buildLeaderboardBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
