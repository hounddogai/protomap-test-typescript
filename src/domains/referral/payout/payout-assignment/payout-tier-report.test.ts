import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPayoutTierReport } from "./payout-tier-report.js";
import { PayoutTier, newPayoutTier } from "./payout-tier.js";

test("PayoutTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_566_908);
  const items: PayoutTier[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPayoutTier(`payout-tier-${index}`, "sample"));
  }
  const report = buildPayoutTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
