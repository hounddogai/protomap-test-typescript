import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalLeaderboardPlanReport } from "./global-leaderboard-plan-report.js";
import { GlobalLeaderboardPlan, newGlobalLeaderboardPlan } from "./global-leaderboard-plan.js";

test("GlobalLeaderboardPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_166_503);
  const items: GlobalLeaderboardPlan[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalLeaderboardPlan(`global-leaderboard-plan-${index}`, "sample"));
  }
  const report = buildGlobalLeaderboardPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
