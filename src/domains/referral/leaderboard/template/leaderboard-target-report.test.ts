import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLeaderboardTargetReport } from "./leaderboard-target-report.js";
import { LeaderboardTarget, newLeaderboardTarget } from "./leaderboard-target.js";

test("LeaderboardTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_576_800);
  const items: LeaderboardTarget[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLeaderboardTarget(`leaderboard-target-${index}`, "sample"));
  }
  const report = buildLeaderboardTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
