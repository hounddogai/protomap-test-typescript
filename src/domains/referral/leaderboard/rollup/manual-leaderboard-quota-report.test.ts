import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualLeaderboardQuotaReport } from "./manual-leaderboard-quota-report.js";
import { ManualLeaderboardQuota, newManualLeaderboardQuota } from "./manual-leaderboard-quota.js";

test("ManualLeaderboardQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_250_950);
  const items: ManualLeaderboardQuota[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newManualLeaderboardQuota(`manual-leaderboard-quota-${index}`, "sample"));
  }
  const report = buildManualLeaderboardQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
