import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualLeaderboardAdjustmentReport } from "./manual-leaderboard-adjustment-report.js";
import { ManualLeaderboardAdjustment, newManualLeaderboardAdjustment } from "./manual-leaderboard-adjustment.js";

test("ManualLeaderboardAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_232_713);
  const items: ManualLeaderboardAdjustment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualLeaderboardAdjustment(`manual-leaderboard-adjustment-${index}`, "sample"));
  }
  const report = buildManualLeaderboardAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
