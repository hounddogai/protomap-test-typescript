import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientPayoutLedgerReport } from "./lenient-payout-ledger-report.js";
import { LenientPayoutLedger, newLenientPayoutLedger } from "./lenient-payout-ledger.js";

test("LenientPayoutLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_682_392);
  const items: LenientPayoutLedger[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientPayoutLedger(`lenient-payout-ledger-${index}`, "sample"));
  }
  const report = buildLenientPayoutLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
