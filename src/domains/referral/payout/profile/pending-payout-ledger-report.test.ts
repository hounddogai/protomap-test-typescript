import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingPayoutLedgerReport } from "./pending-payout-ledger-report.js";
import { PendingPayoutLedger, newPendingPayoutLedger } from "./pending-payout-ledger.js";

test("PendingPayoutLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_625_211);
  const items: PendingPayoutLedger[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPendingPayoutLedger(`pending-payout-ledger-${index}`, "sample"));
  }
  const report = buildPendingPayoutLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
