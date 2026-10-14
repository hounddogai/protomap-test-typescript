import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPayoutClaimReport } from "./payout-claim-report.js";
import { PayoutClaim, newPayoutClaim } from "./payout-claim.js";

test("PayoutClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_543_858);
  const items: PayoutClaim[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPayoutClaim(`payout-claim-${index}`, "sample"));
  }
  const report = buildPayoutClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
