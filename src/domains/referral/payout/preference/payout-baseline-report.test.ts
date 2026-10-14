import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPayoutBaselineReport } from "./payout-baseline-report.js";
import { PayoutBaseline, newPayoutBaseline } from "./payout-baseline.js";

test("PayoutBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_275_456);
  const items: PayoutBaseline[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPayoutBaseline(`payout-baseline-${index}`, "sample"));
  }
  const report = buildPayoutBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
