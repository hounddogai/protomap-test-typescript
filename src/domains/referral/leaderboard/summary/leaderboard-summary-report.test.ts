import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLeaderboardSummaryReport } from "./leaderboard-summary-report.js";
import { LeaderboardSummary, newLeaderboardSummary } from "./leaderboard-summary.js";

test("LeaderboardSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_500_862);
  const items: LeaderboardSummary[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLeaderboardSummary(`leaderboard-summary-${index}`, "sample"));
  }
  const report = buildLeaderboardSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
