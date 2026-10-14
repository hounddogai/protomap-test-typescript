import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLeaderboardOverrideReport } from "./leaderboard-override-report.js";
import { LeaderboardOverride, newLeaderboardOverride } from "./leaderboard-override.js";

test("LeaderboardOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_055_620);
  const items: LeaderboardOverride[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLeaderboardOverride(`leaderboard-override-${index}`, "sample"));
  }
  const report = buildLeaderboardOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
