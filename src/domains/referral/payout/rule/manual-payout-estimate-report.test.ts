import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualPayoutEstimateReport } from "./manual-payout-estimate-report.js";
import { ManualPayoutEstimate, newManualPayoutEstimate } from "./manual-payout-estimate.js";

test("ManualPayoutEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_025_418);
  const items: ManualPayoutEstimate[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newManualPayoutEstimate(`manual-payout-estimate-${index}`, "sample"));
  }
  const report = buildManualPayoutEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
