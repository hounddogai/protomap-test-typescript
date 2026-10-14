import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingLeaderboardSummaryReport } from "./pending-leaderboard-summary-report.js";
import { PendingLeaderboardSummary, newPendingLeaderboardSummary } from "./pending-leaderboard-summary.js";

test("PendingLeaderboardSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_580_924);
  const items: PendingLeaderboardSummary[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPendingLeaderboardSummary(`pending-leaderboard-summary-${index}`, "sample"));
  }
  const report = buildPendingLeaderboardSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
