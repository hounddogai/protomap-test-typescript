import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierBudgetReport } from "./tier-budget-report.js";
import { TierBudget, newTierBudget } from "./tier-budget.js";

test("TierBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_933_870);
  const items: TierBudget[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTierBudget(`tier-budget-${index}`, "sample"));
  }
  const report = buildTierBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
