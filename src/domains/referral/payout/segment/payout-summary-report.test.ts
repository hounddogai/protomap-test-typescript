import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPayoutSummaryReport } from "./payout-summary-report.js";
import { PayoutSummary, newPayoutSummary } from "./payout-summary.js";

test("PayoutSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_183_048);
  const items: PayoutSummary[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPayoutSummary(`payout-summary-${index}`, "sample"));
  }
  const report = buildPayoutSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
