import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRedemptionLedgerReport } from "./redemption-ledger-report.js";
import { RedemptionLedger, newRedemptionLedger } from "./redemption-ledger.js";

test("RedemptionLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_386_296);
  const items: RedemptionLedger[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRedemptionLedger(`redemption-ledger-${index}`, "sample"));
  }
  const report = buildRedemptionLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
