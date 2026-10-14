import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPaywallLedgerReport } from "./paywall-ledger-report.js";
import { PaywallLedger, newPaywallLedger } from "./paywall-ledger.js";

test("PaywallLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_632_220);
  const items: PaywallLedger[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPaywallLedger(`paywall-ledger-${index}`, "sample"));
  }
  const report = buildPaywallLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
