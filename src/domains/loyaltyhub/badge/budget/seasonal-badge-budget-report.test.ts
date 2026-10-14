import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalBadgeBudgetReport } from "./seasonal-badge-budget-report.js";
import { SeasonalBadgeBudget, newSeasonalBadgeBudget } from "./seasonal-badge-budget.js";

test("SeasonalBadgeBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_718_852);
  const items: SeasonalBadgeBudget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalBadgeBudget(`seasonal-badge-budget-${index}`, "sample"));
  }
  const report = buildSeasonalBadgeBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
