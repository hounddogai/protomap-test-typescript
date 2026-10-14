import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredLeaderboardPlanReport } from "./tiered-leaderboard-plan-report.js";
import { TieredLeaderboardPlan, newTieredLeaderboardPlan } from "./tiered-leaderboard-plan.js";

test("TieredLeaderboardPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_770_557);
  const items: TieredLeaderboardPlan[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredLeaderboardPlan(`tiered-leaderboard-plan-${index}`, "sample"));
  }
  const report = buildTieredLeaderboardPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
