import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientStreakLedgerReport } from "./lenient-streak-ledger-report.js";
import { LenientStreakLedger, newLenientStreakLedger } from "./lenient-streak-ledger.js";

test("LenientStreakLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_192_390);
  const items: LenientStreakLedger[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientStreakLedger(`lenient-streak-ledger-${index}`, "sample"));
  }
  const report = buildLenientStreakLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
