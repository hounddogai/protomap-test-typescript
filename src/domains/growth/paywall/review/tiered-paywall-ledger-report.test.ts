import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredPaywallLedgerReport } from "./tiered-paywall-ledger-report.js";
import { TieredPaywallLedger, newTieredPaywallLedger } from "./tiered-paywall-ledger.js";

test("TieredPaywallLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_656_773);
  const items: TieredPaywallLedger[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredPaywallLedger(`tiered-paywall-ledger-${index}`, "sample"));
  }
  const report = buildTieredPaywallLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
