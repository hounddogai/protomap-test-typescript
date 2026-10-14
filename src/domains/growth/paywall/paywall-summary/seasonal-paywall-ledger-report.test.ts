import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalPaywallLedgerReport } from "./seasonal-paywall-ledger-report.js";
import { SeasonalPaywallLedger, newSeasonalPaywallLedger } from "./seasonal-paywall-ledger.js";

test("SeasonalPaywallLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_764_645);
  const items: SeasonalPaywallLedger[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSeasonalPaywallLedger(`seasonal-paywall-ledger-${index}`, "sample"));
  }
  const report = buildSeasonalPaywallLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
