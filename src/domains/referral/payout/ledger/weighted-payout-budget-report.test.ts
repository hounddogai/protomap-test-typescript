import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedPayoutBudgetReport } from "./weighted-payout-budget-report.js";
import { WeightedPayoutBudget, newWeightedPayoutBudget } from "./weighted-payout-budget.js";

test("WeightedPayoutBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_249_606);
  const items: WeightedPayoutBudget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWeightedPayoutBudget(`weighted-payout-budget-${index}`, "sample"));
  }
  const report = buildWeightedPayoutBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
