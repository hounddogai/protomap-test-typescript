import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalPayoutLedgerReport } from "./seasonal-payout-ledger-report.js";
import { SeasonalPayoutLedger, newSeasonalPayoutLedger } from "./seasonal-payout-ledger.js";

test("SeasonalPayoutLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_381_425);
  const items: SeasonalPayoutLedger[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalPayoutLedger(`seasonal-payout-ledger-${index}`, "sample"));
  }
  const report = buildSeasonalPayoutLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
