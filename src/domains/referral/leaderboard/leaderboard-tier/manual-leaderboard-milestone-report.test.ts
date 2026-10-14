import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualLeaderboardMilestoneReport } from "./manual-leaderboard-milestone-report.js";
import { ManualLeaderboardMilestone, newManualLeaderboardMilestone } from "./manual-leaderboard-milestone.js";

test("ManualLeaderboardMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_579_167);
  const items: ManualLeaderboardMilestone[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualLeaderboardMilestone(`manual-leaderboard-milestone-${index}`, "sample"));
  }
  const report = buildManualLeaderboardMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
