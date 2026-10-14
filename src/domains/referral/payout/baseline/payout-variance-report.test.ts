import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPayoutVarianceReport } from "./payout-variance-report.js";
import { PayoutVariance, newPayoutVariance } from "./payout-variance.js";

test("PayoutVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_128_405);
  const items: PayoutVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPayoutVariance(`payout-variance-${index}`, "sample"));
  }
  const report = buildPayoutVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
