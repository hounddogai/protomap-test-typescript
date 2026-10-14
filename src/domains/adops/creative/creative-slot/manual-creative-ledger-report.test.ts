import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualCreativeLedgerReport } from "./manual-creative-ledger-report.js";
import { ManualCreativeLedger, newManualCreativeLedger } from "./manual-creative-ledger.js";

test("ManualCreativeLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_354_206);
  const items: ManualCreativeLedger[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newManualCreativeLedger(`manual-creative-ledger-${index}`, "sample"));
  }
  const report = buildManualCreativeLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
