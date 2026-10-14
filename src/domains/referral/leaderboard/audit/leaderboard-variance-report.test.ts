import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLeaderboardVarianceReport } from "./leaderboard-variance-report.js";
import { LeaderboardVariance, newLeaderboardVariance } from "./leaderboard-variance.js";

test("LeaderboardVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_557_012);
  const items: LeaderboardVariance[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLeaderboardVariance(`leaderboard-variance-${index}`, "sample"));
  }
  const report = buildLeaderboardVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
