import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPayoutBudgetReport } from "./payout-budget-report.js";
import { PayoutBudget, newPayoutBudget } from "./payout-budget.js";

test("PayoutBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_127_196);
  const items: PayoutBudget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPayoutBudget(`payout-budget-${index}`, "sample"));
  }
  const report = buildPayoutBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
