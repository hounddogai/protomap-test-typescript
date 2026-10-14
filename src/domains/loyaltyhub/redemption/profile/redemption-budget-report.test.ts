import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRedemptionBudgetReport } from "./redemption-budget-report.js";
import { RedemptionBudget, newRedemptionBudget } from "./redemption-budget.js";

test("RedemptionBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_813_415);
  const items: RedemptionBudget[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRedemptionBudget(`redemption-budget-${index}`, "sample"));
  }
  const report = buildRedemptionBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
