import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLeaderboardBudgetReport } from "./leaderboard-budget-report.js";
import { LeaderboardBudget, newLeaderboardBudget } from "./leaderboard-budget.js";

test("LeaderboardBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_469_367);
  const items: LeaderboardBudget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLeaderboardBudget(`leaderboard-budget-${index}`, "sample"));
  }
  const report = buildLeaderboardBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
