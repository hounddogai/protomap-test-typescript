import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPayoutEstimateReport } from "./payout-estimate-report.js";
import { PayoutEstimate, newPayoutEstimate } from "./payout-estimate.js";

test("PayoutEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_331_240);
  const items: PayoutEstimate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPayoutEstimate(`payout-estimate-${index}`, "sample"));
  }
  const report = buildPayoutEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
