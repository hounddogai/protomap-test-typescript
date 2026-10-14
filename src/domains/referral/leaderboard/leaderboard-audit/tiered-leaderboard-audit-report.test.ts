import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredLeaderboardAuditReport } from "./tiered-leaderboard-audit-report.js";
import { TieredLeaderboardAudit, newTieredLeaderboardAudit } from "./tiered-leaderboard-audit.js";

test("TieredLeaderboardAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_297_093);
  const items: TieredLeaderboardAudit[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredLeaderboardAudit(`tiered-leaderboard-audit-${index}`, "sample"));
  }
  const report = buildTieredLeaderboardAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
