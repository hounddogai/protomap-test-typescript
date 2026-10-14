import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPayoutPlanReport } from "./payout-plan-report.js";
import { PayoutPlan, newPayoutPlan } from "./payout-plan.js";

test("PayoutPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_887_360);
  const items: PayoutPlan[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPayoutPlan(`payout-plan-${index}`, "sample"));
  }
  const report = buildPayoutPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
